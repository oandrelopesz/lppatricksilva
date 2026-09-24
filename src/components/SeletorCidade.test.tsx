import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { TEXTOS_COMO_FUNCIONA } from "@/content/comoFunciona";
import { TEXTOS_ONDE_ATENDE } from "@/content/ondeAtende";
import { MENSAGENS_WHATSAPP } from "@/content/whatsapp";
import { CidadeProvider, useCidade } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { S6OndeAtende } from "@/sections/S6OndeAtende";
import { SeletorCidade } from "./SeletorCidade";

function MostrarCidade() {
  const { cidade, fonte } = useCidade();
  return <output>{cidade ? `${cidade.nome}:${fonte}` : "nenhuma"}</output>;
}

describe("SeletorCidade", () => {
  beforeEach(() => {
    window.dataLayer = [];
    document.body.innerHTML = '<section id="onde-atende"></section>';
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("lista as 11 cidades em 2 grupos e começa sem escolha", () => {
    render(<CidadeProvider><SeletorCidade /><MostrarCidade /></CidadeProvider>);
    expect(screen.getAllByRole("option").filter((opcao) => (opcao as HTMLOptionElement).value)).toHaveLength(11);
    expect(screen.getAllByRole("group")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("nenhuma");
  });

  it("escolhe a cidade, registra o evento e rola até os locais", () => {
    render(<CidadeProvider><SeletorCidade /><MostrarCidade /></CidadeProvider>);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "tuntum" } });
    fireEvent.click(screen.getByRole("button", { name: TEXTOS_COMO_FUNCIONA.botaoVerLocais }));
    expect(screen.getByRole("status")).toHaveTextContent("Tuntum:seletor");
    expect(window.dataLayer).toContainEqual({ event: "seletor_cidade", cidade: "Tuntum" });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});

describe("SeletorCidade sincronizado com a cidade escolhida (parecer R13)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.dataLayer = [];
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    Element.prototype.scrollIntoView = vi.fn();
  });

  function renderizarComAbas() {
    return render(
      <CidadeProvider>
        <SeletorCidade />
        <S6OndeAtende />
      </CidadeProvider>,
    );
  }

  const seletor = () => screen.getByRole("combobox") as HTMLSelectElement;

  it("?cidade= válido aparece no seletor", () => {
    reiniciarOrigemParaTestes();
    capturarOrigem("?cidade=loreto", null);
    renderizarComAbas();
    expect(seletor().value).toBe("loreto");
  });

  it("escolha feita na aba aparece no seletor", () => {
    renderizarComAbas();
    fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
    expect(seletor().value).toBe("tuntum");
  });

  it("não atropela uma escolha ainda não aplicada", () => {
    renderizarComAbas();
    fireEvent.change(seletor(), { target: { value: "balsas" } });
    fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
    expect(seletor().value).toBe("balsas");
  });

  it("com a opção vazia, o botão leva à visão geral de onde atende", () => {
    renderizarComAbas();
    fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
    fireEvent.change(seletor(), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: TEXTOS_COMO_FUNCIONA.botaoVerLocais }));
    expect(screen.queryByRole("tabpanel")).toBeNull();
    expect(screen.getAllByRole("link", { name: TEXTOS_ONDE_ATENDE.clinica.comoChegar })).toHaveLength(14);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toHaveAttribute("role", "tab");
  });
});

describe("SeletorCidade com a opção vazia aplicada (parecer R13b)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.dataLayer = [];
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    Element.prototype.scrollIntoView = vi.fn();
  });

  function renderizarComCtaGeral() {
    return render(
      <CidadeProvider>
        <SeletorCidade />
        <S6OndeAtende />
        <CtaWhatsApp localCta="hero">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
  }

  /** Clique com Ctrl: o CTA grava a URL completa no href sem navegar. */
  function textoDoCtaGeral() {
    const cta = screen.getByRole("link", { name: "Agendar" });
    fireEvent.click(cta, { ctrlKey: true });
    return new URL(cta.getAttribute("href")!).searchParams.get("text")!;
  }

  function aplicarOpcaoVazia() {
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: TEXTOS_COMO_FUNCIONA.botaoVerLocais }));
  }

  it("cidade escolhida na aba: a opção vazia limpa a cidade e o CTA geral volta à mensagem base", () => {
    renderizarComCtaGeral();
    fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
    expect(textoDoCtaGeral()).toContain("Tuntum");
    aplicarOpcaoVazia();
    const texto = textoDoCtaGeral();
    expect(texto.startsWith(`${MENSAGENS_WHATSAPP.base} (ref `)).toBe(true);
    expect(texto).not.toContain("Tuntum");
  });

  it("cidade vinda de ?cidade=: a opção vazia limpa a cidade e o CTA geral volta à mensagem base", () => {
    reiniciarOrigemParaTestes();
    capturarOrigem("?cidade=loreto", null);
    renderizarComCtaGeral();
    expect(textoDoCtaGeral()).toContain("Loreto");
    aplicarOpcaoVazia();
    const texto = textoDoCtaGeral();
    expect(texto.startsWith(`${MENSAGENS_WHATSAPP.base} (ref `)).toBe(true);
    expect(texto).not.toContain("Loreto");
  });
});
