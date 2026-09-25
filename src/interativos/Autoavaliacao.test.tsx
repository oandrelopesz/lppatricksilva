import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { navegacao } from "@/components/CtaWhatsApp";
import { TEXTOS_AUTOAVALIACAO as T } from "@/content/autoavaliacao";
import { CidadeProvider } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { LINK_WHATSAPP_BASE } from "@/lib/whatsapp";
import { Autoavaliacao, montarResumo } from "./Autoavaliacao";

function renderizar() {
  return render(<CidadeProvider><Autoavaliacao /></CidadeProvider>);
}

const [regiao, limitacao, tentativa] = T.etapas;

describe("Autoavaliacao", () => {
  beforeEach(() => {
    reiniciarOrigemParaTestes();
    window.dataLayer = [];
    navegacao.ir = vi.fn();
  });

  it("começa na etapa 1 com fieldset, legenda e progresso anunciado sem roubar foco", () => {
    renderizar();
    expect(screen.getByRole("group", { name: regiao.pergunta })).toBeInTheDocument();
    expect(screen.getByText(T.progresso(1, 3))).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText(regiao.pergunta)).not.toHaveFocus();
  });

  it("mostra barra de progresso que acompanha a etapa e opções em cartões", () => {
    renderizar();
    const progresso = screen.getByRole("progressbar");
    expect(progresso).toHaveAttribute("aria-valuenow", "1");
    expect(progresso).toHaveAttribute("aria-valuemax", "3");
    expect(screen.getByRole("button", { name: regiao.opcoes[0] })).toHaveClass("autoavaliacao-opcao");
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    fireEvent.click(screen.getByRole("button", { name: T.voltar }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("três respostas levam ao resultado com aviso e sem procedimento", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    expect(screen.getByText(T.aviso)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\bPRP\b|\bBMA\b|infiltra/i);
  });

  it("voltar e pular navegam, apagando a resposta omitida", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: T.voltar }));
    expect(screen.getByText(T.respostaAnterior(regiao.opcoes[0]))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: T.pular }));
    expect(screen.getByText(T.progresso(2, 3))).toBeInTheDocument();
    expect(window.dataLayer).toContainEqual({ event: "autoavaliacao_pulada", etapa: 1 });
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    expect(screen.queryByText(T.resumo.semRespostas)).toBeNull();
    expect(screen.getByText(montarResumo({ limitacao: limitacao.opcoes[0], tentativa: tentativa.opcoes[0] }))).toBeInTheDocument();
  });

  it("ao voltar, trocar a resposta atualiza o resumo", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: T.voltar }));
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[1] }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    const resumo = screen.getByText(/^Meu resumo:/).textContent!;
    expect(resumo).toContain(T.resumo.regiao(regiao.opcoes[1]));
    expect(resumo).not.toContain(T.resumo.regiao(regiao.opcoes[0]));
  });

  it("o resumo só segue ao WhatsApp após opt-in, fora do href e dos eventos", () => {
    // A navegação sai pelo teto do clique (o detector da conversão é testado no analytics).
    vi.useFakeTimers();
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    const cta = screen.getByRole("link", { name: T.cta });
    fireEvent.click(cta);
    act(() => vi.advanceTimersByTime(4000));
    expect(vi.mocked(navegacao.ir).mock.lastCall?.[0]).not.toContain(regiao.opcoes[0]);
    fireEvent.click(screen.getByRole("checkbox", { name: T.incluirResumo }));
    expect(cta.getAttribute("href")).not.toContain(regiao.opcoes[0]);
    fireEvent.click(cta);
    act(() => vi.advanceTimersByTime(4000));
    expect(new URL(vi.mocked(navegacao.ir).mock.lastCall![0]).searchParams.get("text")).toContain(T.resumo.regiao(regiao.opcoes[0]));
    expect(JSON.stringify(window.dataLayer)).not.toContain(regiao.opcoes[0]);
    vi.useRealTimers();
  });

  it("depois de um clique sem opt-in, marcar a caixa volta o href ao link base (parecer R10)", () => {
    // Com a cidade da URL, o link completo difere do base (sem código de referência, só a cidade o distingue).
    capturarOrigem("?cidade=tuntum", null);
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    const cta = screen.getByRole("link", { name: T.cta });
    fireEvent.click(cta);
    expect(cta.getAttribute("href")).not.toBe(LINK_WHATSAPP_BASE);
    fireEvent.click(screen.getByRole("checkbox", { name: T.incluirResumo }));
    expect(cta.getAttribute("href")).toBe(LINK_WHATSAPP_BASE);
    window.dataLayer = [];
    fireEvent(cta, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
    expect(cta.getAttribute("href")).toBe(LINK_WHATSAPP_BASE);
    const evento = window.dataLayer.find((e) => e.event === "clique_whatsapp")!;
    expect(evento).toBeDefined();
    expect(evento).not.toHaveProperty("ref");
    const tudo = `${cta.getAttribute("href")} ${JSON.stringify(window.dataLayer)}`;
    for (const etapa of T.etapas) for (const opcao of etapa.opcoes) expect(tudo).not.toContain(opcao);
  });
  it("a caixa pede autorização específica e explica o que o WhatsApp recebe (textos-lgpd, item E)", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    expect(screen.getByRole("checkbox", { name: "Autorizo incluir meu resumo da dor na mensagem do WhatsApp" })).not.toBeChecked();
    expect(
      screen.getByText("Ao abrir o link, o WhatsApp pode receber esse texto. O Dr. Patrick Santos só recebe a mensagem se você enviar. Você pode agendar sem incluir o resumo."),
    ).toBeInTheDocument();
  });

  it("nenhum evento recebe resposta e registra etapas sem dados de saúde", () => {
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: limitacao.opcoes[0] }));
    fireEvent.click(screen.getByRole("button", { name: tentativa.opcoes[0] }));
    const eventos = JSON.stringify(window.dataLayer);
    for (const etapa of T.etapas) for (const opcao of etapa.opcoes) expect(eventos).not.toContain(opcao);
    expect(window.dataLayer).toContainEqual({ event: "autoavaliacao_concluida" });
    expect(window.dataLayer).toContainEqual({ event: "autoavaliacao_etapa", etapa: 2 });
  });

  it("monta resumo apenas com fragmentos respondidos e omite a caixa sem respostas", () => {
    expect(montarResumo({ limitacao: limitacao.opcoes[0] })).toBe(`${T.resumo.inicio} ${T.resumo.limitacao(limitacao.opcoes[0])}.`);
    expect(montarResumo({})).toBe(T.resumo.semRespostas);
    expect(montarResumo({ regiao: regiao.opcoes[0], tentativa: tentativa.opcoes[0] })).not.toMatch(/\s{2}|;\s*;/);
    renderizar();
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: T.pular }));
    expect(screen.queryByRole("checkbox", { name: T.incluirResumo })).toBeNull();
  });

  it("botões são ações sem aria-pressed e o foco segue a pergunta após ação", () => {
    renderizar();
    expect(document.querySelector("[aria-pressed]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: regiao.opcoes[0] }));
    expect(screen.getByText(limitacao.pergunta)).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: T.voltar }));
    expect(screen.getByText(regiao.pergunta)).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: T.pular }));
    expect(screen.getByText(limitacao.pergunta)).toHaveFocus();
  });
});
