import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CidadeProvider, useCidade } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
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
});
