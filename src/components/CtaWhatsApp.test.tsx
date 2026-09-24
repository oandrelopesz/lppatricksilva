import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CidadeProvider, useCidade } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { LINK_WHATSAPP_BASE, LINK_WHATSAPP_DUVIDA } from "@/lib/whatsapp";
import { CtaWhatsApp, navegacao } from "./CtaWhatsApp";

function EscolherTuntum() {
  const { escolherCidade } = useCidade();
  return <button onClick={() => escolherCidade("tuntum", "aba")}>escolher</button>;
}

const textoDe = (url: string) => new URL(url).searchParams.get("text")!;

describe("CtaWhatsApp", () => {
  const irOriginal = navegacao.ir;

  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
    navegacao.ir = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    navegacao.ir = irOriginal;
    vi.useRealTimers();
  });

  it("no HTML inicial aponta para o link base (funciona sem JavaScript)", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="hero">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    expect(screen.getByRole("link", { name: "Agendar" }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5513996822680\?text=/);
  });

  it("clique simples registra o evento e navega uma vez quando o GTM confirma", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="hero">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Agendar" }));
    const evento = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
    expect(evento).toMatchObject({ local_cta: "hero", eventTimeout: 800 });
    expect(navegacao.ir).not.toHaveBeenCalled();
    (evento.eventCallback as () => void)();
    vi.advanceTimersByTime(1000);
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
    const url = vi.mocked(navegacao.ir).mock.calls[0][0];
    expect(textoDe(url)).toMatch(/\(ref [A-HJ-NP-Z2-9]{6}\)$/);
    expect(textoDe(url)).not.toContain("Balsas");
  });

  it("o evento não leva o gclid (o Ads lê da URL de entrada; o GA4 nunca recebe)", () => {
    reiniciarOrigemParaTestes();
    capturarOrigem("?utm_source=google&gclid=Cj0abc_1", null);
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="hero">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Agendar" }));
    const evento = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
    expect(evento.utm_source).toBe("google");
    expect(evento.gclid).toBeUndefined();
    expect(JSON.stringify(evento)).not.toContain("Cj0abc_1");
  });

  it("dois cliques seguidos: o segundo (com resumo e sem local) não herda ref nem local do primeiro", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="onde_atende" cidadeFixa="Balsas" local="Hospital São José">
          Local
        </CtaWhatsApp>
        <CtaWhatsApp localCta="autoavaliacao" resumo="Marquei no site: joelho.">
          Resumo
        </CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Local" }));
    fireEvent.click(screen.getByRole("link", { name: "Resumo" }));
    // Modelo de dados do GTM: cada push mescla as chaves, inclusive as com valor undefined.
    const modelo: Record<string, unknown> = {};
    const noSegundoClique: Record<string, unknown>[] = [];
    for (const item of window.dataLayer!) {
      if (!("event" in item) && !("local_cta" in item) && !("ref" in item)) continue;
      Object.assign(modelo, item);
      if (item.event === "clique_whatsapp") noSegundoClique.push({ ...modelo });
    }
    expect(noSegundoClique).toHaveLength(2);
    expect(noSegundoClique[0]).toMatchObject({ local: "Hospital São José", cidade: "Balsas" });
    expect(noSegundoClique[0].ref).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(noSegundoClique[1].local_cta).toBe("autoavaliacao");
    expect(noSegundoClique[1].ref).toBeUndefined();
    expect(noSegundoClique[1].local).toBeUndefined();
    expect(noSegundoClique[1].cidade).toBeUndefined();
  });

  it("sem GTM, navega depois do tempo-limite", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="faq">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Agendar" }));
    vi.advanceTimersByTime(799);
    expect(navegacao.ir).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
  });

  it("clique com Ctrl deixa o navegador abrir nova aba e só registra o evento", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="rodape">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    const link = screen.getByRole("link", { name: "Agendar" });
    fireEvent.click(link, { ctrlKey: true });
    vi.advanceTimersByTime(1000);
    expect(navegacao.ir).not.toHaveBeenCalled();
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "clique_whatsapp", local_cta: "rodape" }));
    expect(textoDe(link.getAttribute("href")!)).toMatch(/\(ref /);
  });

  it("clique com o botão do meio monta o link completo e só registra o evento", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="sobre">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    const link = screen.getByRole("link", { name: "Agendar" });
    // O @testing-library/dom instalado não tem fireEvent.auxClick: dispara o evento nativo.
    fireEvent(link, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
    vi.advanceTimersByTime(1000);
    expect(navegacao.ir).not.toHaveBeenCalled();
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "clique_whatsapp", local_cta: "sobre" }));
    expect(textoDe(link.getAttribute("href")!)).toMatch(/\(ref [A-HJ-NP-Z2-9]{6}\)$/);
  });

  it("depois que o usuário escolhe a cidade, o clique inclui a cidade", () => {
    render(
      <CidadeProvider>
        <EscolherTuntum />
        <CtaWhatsApp localCta="faq">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByText("escolher"));
    fireEvent.click(screen.getByRole("link", { name: "Agendar" }));
    vi.advanceTimersByTime(800);
    expect(textoDe(vi.mocked(navegacao.ir).mock.calls[0][0])).toContain("Tuntum");
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "clique_whatsapp", cidade: "Tuntum" }));
  });

  it("CTA de local manda cidade e local; o resumo nunca vai para o evento", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="onde_atende" cidadeFixa="Balsas" local="Hospital São José" resumo="Marquei no site: joelho.">
          Agendar em Balsas
        </CtaWhatsApp>
      </CidadeProvider>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Agendar em Balsas" }));
    vi.advanceTimersByTime(800);
    const texto = textoDe(vi.mocked(navegacao.ir).mock.calls[0][0]);
    expect(texto).toContain("Balsas");
    expect(texto).toContain("Hospital São José");
    expect(texto).toContain("Marquei no site: joelho.");
    const evento = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
    expect(JSON.stringify(evento)).not.toContain("joelho");
  });

  it("com resumo, o href do DOM continua o link base e a navegação usa a URL completa", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="autoavaliacao" resumo="Meu resumo: joelho.">
          Agendar
        </CtaWhatsApp>
      </CidadeProvider>,
    );
    const link = screen.getByRole("link", { name: "Agendar" });
    fireEvent.click(link, { ctrlKey: true });
    expect(link.getAttribute("href")).toBe(LINK_WHATSAPP_BASE);
    vi.advanceTimersByTime(800);
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
    expect(textoDe(vi.mocked(navegacao.ir).mock.calls[0][0])).toContain("Meu resumo: joelho.");
    expect(document.body.innerHTML).not.toContain("joelho");
  });

  it("com resumo, o botão do meio mantém o link base no href", () => {
    render(
      <CidadeProvider>
        <CtaWhatsApp localCta="autoavaliacao" resumo="Meu resumo: joelho.">
          Agendar
        </CtaWhatsApp>
      </CidadeProvider>,
    );
    const link = screen.getByRole("link", { name: "Agendar" });
    fireEvent(link, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
    expect(link.getAttribute("href")).toBe(LINK_WHATSAPP_BASE);
    expect(document.body.innerHTML).not.toContain("joelho");
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "clique_whatsapp", local_cta: "autoavaliacao" }));
  });

  describe("intenção", () => {
    it("CTA de dúvida: href inicial e clique usam wa.duvida e o evento leva intencao", () => {
      render(
        <CidadeProvider>
          <CtaWhatsApp localCta="onde_atende" intencao="duvida">
            Perguntar
          </CtaWhatsApp>
        </CidadeProvider>,
      );
      const link = screen.getByRole("link", { name: "Perguntar" });
      expect(link.getAttribute("href")).toBe(LINK_WHATSAPP_DUVIDA);
      fireEvent.click(link);
      vi.advanceTimersByTime(800);
      expect(textoDe(vi.mocked(navegacao.ir).mock.calls[0][0])).toMatch(/^Olá! Vim do site e gostaria de tirar uma dúvida antes de agendar uma consulta\. \(ref [A-HJ-NP-Z2-9]{6}\)$/);
      expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "clique_whatsapp", intencao: "duvida" }));
    });

    it("CTA de dúvida com cidade escolhida inclui a cidade", () => {
      render(
        <CidadeProvider>
          <EscolherTuntum />
          <CtaWhatsApp localCta="faq" intencao="duvida">
            Perguntar
          </CtaWhatsApp>
        </CidadeProvider>,
      );
      fireEvent.click(screen.getByText("escolher"));
      fireEvent.click(screen.getByRole("link", { name: "Perguntar" }));
      vi.advanceTimersByTime(800);
      expect(textoDe(vi.mocked(navegacao.ir).mock.calls[0][0])).toContain("tirar uma dúvida antes de agendar uma consulta em Tuntum.");
    });

    it("sem a prop, o CTA agenda e o evento leva intencao agendar", () => {
      render(
        <CidadeProvider>
          <CtaWhatsApp localCta="hero">Agendar</CtaWhatsApp>
        </CidadeProvider>,
      );
      const link = screen.getByRole("link", { name: "Agendar" });
      expect(link.getAttribute("href")).toBe(LINK_WHATSAPP_BASE);
      fireEvent.click(link);
      vi.advanceTimersByTime(800);
      expect(textoDe(vi.mocked(navegacao.ir).mock.calls[0][0])).toContain("gostaria de agendar uma consulta");
      expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "clique_whatsapp", intencao: "agendar" }));
    });
  });

  it("resumo incluído depois de um clique sem resumo volta o href ao link base (parecer R10)", () => {
    const { rerender } = render(
      <CidadeProvider>
        <CtaWhatsApp localCta="autoavaliacao">Agendar</CtaWhatsApp>
      </CidadeProvider>,
    );
    const link = screen.getByRole("link", { name: "Agendar" });
    fireEvent.click(link, { ctrlKey: true });
    expect(textoDe(link.getAttribute("href")!)).toMatch(/\(ref /);
    rerender(
      <CidadeProvider>
        <CtaWhatsApp localCta="autoavaliacao" resumo="Meu resumo: joelho.">
          Agendar
        </CtaWhatsApp>
      </CidadeProvider>,
    );
    expect(link.getAttribute("href")).toBe(LINK_WHATSAPP_BASE);
    window.dataLayer = [];
    fireEvent(link, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
    expect(link.getAttribute("href")).toBe(LINK_WHATSAPP_BASE);
    const evento = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
    expect(evento).not.toHaveProperty("ref");
    expect(`${link.getAttribute("href")} ${JSON.stringify(window.dataLayer)}`).not.toContain("joelho");
  });
});
