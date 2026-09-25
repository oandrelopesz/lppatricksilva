import fs from "node:fs";
import path from "node:path";
import { act, fireEvent } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CtaWhatsApp, navegacao } from "@/components/CtaWhatsApp";
import { CidadeProvider } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { LINK_WHATSAPP_BASE } from "@/lib/whatsapp";
import { processarCliquePendente } from "./cliquePendente";

/** O segurador inline do index.html (o mesmo código que vai para o HTML publicado). */
const indexHtml = fs.readFileSync(path.resolve(__dirname, "../../index.html"), "utf8");
const segurador = indexHtml.match(/<script id="segurador-clique">([\s\S]*?)<\/script>/)![1];
const corpo = segurador.match(/^\s*\(function \(w\) \{([\s\S]*)\}\)\(window\);\s*$/)![1];

const Cta = () => (
  <CidadeProvider>
    <CtaWhatsApp localCta="hero">Agendar</CtaWhatsApp>
  </CidadeProvider>
);

type JanelaDoTeste = Window & { __lpHidratado?: boolean; __lpCliquePendente?: unknown; __lpSeguranca?: number };
const w = window as JanelaDoTeste;

describe("segurador de clique antes da hidratação (validação do Tracking, achado 3)", () => {
  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
    delete w.__lpHidratado;
    delete w.__lpCliquePendente;
    navegacao.ir = vi.fn();
    vi.useFakeTimers();
    vi.stubGlobal("PerformanceObserver", undefined);
  });

  afterEach(() => {
    w.__lpHidratado = true;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("o segurador tem menos de 1 KB", () => {
    expect(new TextEncoder().encode(segurador).length).toBeLessThan(1024);
  });

  it("clique antes da hidratação é segurado e, na hidratação, registrado e navegado pela regra do clique", async () => {
    // eslint-disable-next-line no-new-func
    new Function("w", corpo)(window);
    const raiz = document.createElement("div");
    raiz.innerHTML = renderToString(<Cta />);
    document.body.append(raiz);
    const link = raiz.querySelector("a")!;
    expect(link.dataset.localCta).toBe("hero");

    const seguiu = fireEvent.click(link);
    expect(seguiu).toBe(false);
    expect(w.__lpCliquePendente).toMatchObject({ href: LINK_WHATSAPP_BASE, localCta: "hero" });
    expect(window.dataLayer!.some((e) => e.event === "clique_whatsapp")).toBe(false);

    vi.advanceTimersByTime(1000);
    await act(async () => {
      hydrateRoot(raiz, <Cta />);
    });
    act(() => processarCliquePendente());
    expect(w.__lpHidratado).toBe(true);
    expect(w.__lpCliquePendente).toBeUndefined();
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "clique_whatsapp", local_cta: "hero" }));
    expect(link).toHaveAttribute("aria-busy", "true");
    // Teto de 3.000 ms contado do clique original (1.000 ms já passaram).
    act(() => vi.advanceTimersByTime(1999));
    expect(navegacao.ir).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
    // A navegação de segurança foi cancelada: nada mais acontece.
    act(() => vi.advanceTimersByTime(5000));
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
  });

  it("com o React já ouvindo e o efeito da Raiz pendente, o clique tem um só responsável (R28, item 2)", async () => {
    new Function("w", corpo)(window);
    const raiz = document.createElement("div");
    raiz.innerHTML = renderToString(<Cta />);
    document.body.append(raiz);
    await act(async () => {
      hydrateRoot(raiz, <Cta />);
    });
    // React hidratado e ouvindo, mas __lpHidratado ainda não foi marcado pelo efeito da Raiz.
    expect(w.__lpHidratado).toBeUndefined();
    fireEvent.click(raiz.querySelector("a")!);
    expect(window.dataLayer!.filter((e) => e.event === "clique_whatsapp")).toHaveLength(0);
    expect(w.__lpCliquePendente).toBeDefined();
    act(() => processarCliquePendente());
    expect(window.dataLayer!.filter((e) => e.event === "clique_whatsapp")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
  });

  it("se a app não hidratar, a navegação de segurança vai para o href em 3.500 ms", () => {
    let aoClicar: ((e: unknown) => void) | undefined;
    const assign = vi.fn();
    const janela = {
      addEventListener: (_tipo: string, f: (e: unknown) => void) => void (aoClicar = f),
      performance,
      setTimeout: (f: () => void, ms: number) => window.setTimeout(f, ms),
      location: { assign },
    } as Record<string, unknown>;
    new Function("w", corpo)(janela);
    const link = document.createElement("a");
    link.href = LINK_WHATSAPP_BASE;
    link.dataset.localCta = "faq";
    document.body.append(link);
    const evento = { target: link, button: 0, preventDefault: vi.fn(), stopPropagation: vi.fn() };
    aoClicar!(evento);
    expect(evento.preventDefault).toHaveBeenCalled();
    expect(evento.stopPropagation).toHaveBeenCalled();
    expect(janela.__lpCliquePendente).toMatchObject({ href: LINK_WHATSAPP_BASE, localCta: "faq" });
    vi.advanceTimersByTime(3499);
    expect(assign).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(assign).toHaveBeenCalledWith(LINK_WHATSAPP_BASE);
  });

  it("clique com modificador ou outro botão não é segurado", () => {
    new Function("w", corpo)(window);
    const raiz = document.createElement("div");
    raiz.innerHTML = renderToString(<Cta />);
    document.body.append(raiz);
    const link = raiz.querySelector("a")!;
    for (const opcoes of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      expect(fireEvent.click(link, opcoes)).toBe(true);
    }
    expect(w.__lpCliquePendente).toBeUndefined();
  });

  it("sem clique pendente, a hidratação só marca __lpHidratado", () => {
    processarCliquePendente();
    expect(w.__lpHidratado).toBe(true);
    expect(window.dataLayer!.some((e) => e.event === "clique_whatsapp")).toBe(false);
  });

  it("clique segurado entregue na hidratação e novo toque logo depois: um evento e uma navegação (R28, item 3)", async () => {
    new Function("w", corpo)(window);
    const raiz = document.createElement("div");
    raiz.innerHTML = renderToString(<Cta />);
    document.body.append(raiz);
    const link = raiz.querySelector("a")!;
    fireEvent.click(link);
    await act(async () => {
      hydrateRoot(raiz, <Cta />);
    });
    act(() => processarCliquePendente());
    expect(fireEvent.click(link)).toBe(false);
    expect(window.dataLayer!.filter((e) => e.event === "clique_whatsapp")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(navegacao.ir).toHaveBeenCalledTimes(1);
  });

  describe("prazo único do clique segurado (R28, item 4)", () => {
    /**
     * window real (flags e relógio), mas com location falso para contar a navegação de segurança. O
     * handler é capturado, não registrado: os seguradores dos testes anteriores continuam na window.
     */
    function instalarSeguradorContando() {
      const assign = vi.fn();
      let handler: ((e: unknown) => void) | undefined;
      const janela = new Proxy(window, {
        get: (alvo, chave) => {
          if (chave === "location") return { assign };
          if (chave === "addEventListener") return (_tipo: string, f: (e: unknown) => void) => void (handler = f);
          const valor = Reflect.get(alvo, chave);
          return typeof valor === "function" ? valor.bind(alvo) : valor;
        },
        set: (alvo, chave, valor) => Reflect.set(alvo, chave, valor),
      });
      new Function("w", corpo)(janela);
      const clicar = (link: Element) => handler!({ target: link, button: 0, preventDefault: vi.fn(), stopPropagation: vi.fn() });
      return { assign, clicar };
    }

    for (const hidratacaoMs of [2999, 3400, 3499]) {
      it(`hidratação aos ${hidratacaoMs} ms: uma navegação só, nunca depois dos 3.000 ms (ou na hora)`, async () => {
        const { assign, clicar } = instalarSeguradorContando();
        const raiz = document.createElement("div");
        raiz.innerHTML = renderToString(<Cta />);
        document.body.append(raiz);
        clicar(raiz.querySelector("a")!);
        act(() => vi.advanceTimersByTime(hidratacaoMs));
        await act(async () => {
          hydrateRoot(raiz, <Cta />);
        });
        act(() => processarCliquePendente());
        expect(window.dataLayer!.filter((e) => e.event === "clique_whatsapp")).toHaveLength(1);
        const ate = Math.max(3000 - hidratacaoMs, 0);
        if (ate > 0) {
          expect(navegacao.ir).not.toHaveBeenCalled();
          act(() => vi.advanceTimersByTime(ate));
        }
        expect(navegacao.ir).toHaveBeenCalledTimes(1);
        act(() => vi.advanceTimersByTime(5000));
        expect(navegacao.ir).toHaveBeenCalledTimes(1);
        expect(assign).not.toHaveBeenCalled();
      });
    }

    it("hidratação depois da navegação de segurança: não registra nem navega de novo", async () => {
      const { assign, clicar } = instalarSeguradorContando();
      const raiz = document.createElement("div");
      raiz.innerHTML = renderToString(<Cta />);
      document.body.append(raiz);
      clicar(raiz.querySelector("a")!);
      act(() => vi.advanceTimersByTime(3600));
      expect(assign).toHaveBeenCalledTimes(1);
      await act(async () => {
        hydrateRoot(raiz, <Cta />);
      });
      act(() => processarCliquePendente());
      act(() => vi.advanceTimersByTime(5000));
      expect(navegacao.ir).not.toHaveBeenCalled();
      expect(assign).toHaveBeenCalledTimes(1);
    });
  });
});
