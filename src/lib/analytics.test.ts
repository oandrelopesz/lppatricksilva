import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    window.dataLayer = [];
    document.head.querySelectorAll("script[data-gtm]").forEach((s) => s.remove());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("track põe o evento na fila e remove parâmetros vazios", async () => {
    const { track } = await import("./analytics");
    track("faq_aberta", { pergunta: "valor", vazio: undefined });
    expect(window.dataLayer).toContainEqual({ event: "faq_aberta", pergunta: "valor" });
  });

  it("sem GTM_ID não injeta script", async () => {
    vi.stubEnv("VITE_GTM_ID", "");
    const { carregarGtm } = await import("./analytics");
    carregarGtm();
    expect(document.head.querySelector("script[data-gtm]")).toBeNull();
  });

  it("com GTM_ID injeta o script uma vez, mesmo chamado duas vezes", async () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TESTE01");
    const { carregarGtm } = await import("./analytics");
    carregarGtm();
    carregarGtm();
    const scripts = document.head.querySelectorAll("script[data-gtm]");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute("src")).toBe("https://www.googletagmanager.com/gtm.js?id=GTM-TESTE01");
  });

  it("clique no WhatsApp antes do GTM dispara o carregamento na hora", async () => {
    vi.stubEnv("VITE_GTM_ID", "GTM-TESTE01");
    const { track } = await import("./analytics");
    track("clique_whatsapp", { local_cta: "hero" });
    expect(document.head.querySelector("script[data-gtm]")).not.toBeNull();
  });

  it("registrarPagina põe a URL limpa na fila, sem utm_term", async () => {
    window.history.replaceState(null, "", "/?utm_source=google&utm_term=dor+no+joelho#duvidas");
    const { registrarPagina } = await import("./analytics");
    registrarPagina();
    const item = window.dataLayer!.find((e) => "pagina_limpa" in e)!;
    expect(item.pagina_limpa).toBe(`${window.location.origin}/?utm_source=google`);
    window.history.replaceState(null, "", "/");
  });

  it("registrarPagina nunca leva o gclid ao page_location do GA4", async () => {
    window.history.replaceState(null, "", "/?utm_source=google&utm_medium=cpc&gclid=Cj0.KCQ_a-1");
    const { registrarPagina } = await import("./analytics");
    registrarPagina();
    const item = window.dataLayer!.find((e) => "pagina_limpa" in e)!;
    expect(item.pagina_limpa).toBe(`${window.location.origin}/?utm_source=google&utm_medium=cpc`);
    window.history.replaceState(null, "", "/");
  });

  it("antes de cada clique_whatsapp zera todos os campos opcionais no dataLayer", async () => {
    const { CAMPOS_CLIQUE, track } = await import("./analytics");
    track("clique_whatsapp", { local_cta: "hero" });
    const i = window.dataLayer!.findIndex((e) => e.event === "clique_whatsapp");
    const zerado = window.dataLayer![i - 1];
    expect(Object.keys(zerado).sort()).toEqual([...CAMPOS_CLIQUE].sort());
    expect(Object.values(zerado).every((v) => v === undefined)).toBe(true);
    expect(CAMPOS_CLIQUE).toEqual(
      expect.arrayContaining(["local_cta", "intencao", "cidade", "local", "utm_source", "utm_medium", "utm_campaign", "utm_content"]),
    );
    // Sem código de referência (spec §21): o ref nem aparece zerado no modelo do GTM.
    expect(CAMPOS_CLIQUE).not.toContain("ref");
  });

  it("outros eventos não zeram nada", async () => {
    const { track } = await import("./analytics");
    track("faq_aberta", { pergunta: "valor" });
    expect(window.dataLayer).toEqual([{ event: "faq_aberta", pergunta: "valor" }]);
  });

  it("com requestIdleCallback presente mas que nunca chama, o GTM carrega até 1,5 s (parecer R18)", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_GTM_ID", "GTM-TESTE01");
    const { agendarGtm } = await import("./analytics");
    const ocioso = vi.fn();
    vi.stubGlobal("requestIdleCallback", ocioso);
    try {
      agendarGtm();
      expect(ocioso).toHaveBeenCalledWith(expect.any(Function), { timeout: 1500 });
      vi.advanceTimersByTime(1499);
      expect(document.head.querySelector("script[data-gtm]")).toBeNull();
      vi.advanceTimersByTime(1);
      expect(document.head.querySelectorAll("script[data-gtm]")).toHaveLength(1);
      (ocioso.mock.calls[0][0] as () => void)();
      expect(document.head.querySelectorAll("script[data-gtm]")).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("agendarGtm carrega o GTM depois, não na hora", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_GTM_ID", "GTM-TESTE01");
    const { agendarGtm } = await import("./analytics");
    const w = window as { requestIdleCallback?: unknown };
    const original = w.requestIdleCallback;
    // Força o fallback de 1,5 s.
    w.requestIdleCallback = undefined;
    agendarGtm();
    expect(document.head.querySelector("script[data-gtm]")).toBeNull();
    vi.advanceTimersByTime(1500);
    expect(document.head.querySelector("script[data-gtm]")).not.toBeNull();
    w.requestIdleCallback = original;
  });

  describe("GTM no primeiro entre ocioso e interação (spec §7 e §8)", () => {
    const INTERACOES = ["pointerdown", "touchstart", "keydown", "scroll"];

    it("a primeira interação carrega o GTM antes do ocioso, com ouvintes passivos que saem depois", async () => {
      vi.useFakeTimers();
      vi.stubEnv("VITE_GTM_ID", "GTM-TESTE01");
      vi.stubGlobal("requestIdleCallback", vi.fn());
      const adicionar = vi.spyOn(window, "addEventListener");
      const remover = vi.spyOn(window, "removeEventListener");
      try {
        const { agendarGtm } = await import("./analytics");
        agendarGtm();
        for (const tipo of INTERACOES) {
          expect(adicionar).toHaveBeenCalledWith(tipo, expect.any(Function), expect.objectContaining({ passive: true, once: true }));
        }
        expect(document.head.querySelector("script[data-gtm]")).toBeNull();
        window.dispatchEvent(new Event("pointerdown"));
        expect(document.head.querySelectorAll("script[data-gtm]")).toHaveLength(1);
        for (const tipo of INTERACOES) expect(remover).toHaveBeenCalledWith(tipo, expect.any(Function), expect.anything());
        window.dispatchEvent(new Event("keydown"));
        vi.advanceTimersByTime(1500);
        expect(document.head.querySelectorAll("script[data-gtm]")).toHaveLength(1);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("se o ocioso vier primeiro, os ouvintes de interação saem", async () => {
      vi.useFakeTimers();
      vi.stubEnv("VITE_GTM_ID", "GTM-TESTE01");
      vi.stubGlobal("requestIdleCallback", (cb: () => void) => cb());
      const remover = vi.spyOn(window, "removeEventListener");
      try {
        const { agendarGtm } = await import("./analytics");
        agendarGtm();
        expect(document.head.querySelectorAll("script[data-gtm]")).toHaveLength(1);
        for (const tipo of INTERACOES) expect(remover).toHaveBeenCalledWith(tipo, expect.any(Function), expect.anything());
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe("tempo do clique_whatsapp (spec §7, validação do Tracking)", () => {
    /** PerformanceObserver falso: entregar(entradas) simula recursos vistos pelo navegador. */
    let entregar: ((entradas: Array<{ name: string; startTime: number }>) => void) | undefined;
    let observados: unknown[] = [];
    const desconectar = vi.fn();
    class ObservadorDeRecursos {
      constructor(private retorno: (lista: { getEntries: () => unknown[] }) => void) {
        entregar = (entradas) => this.retorno({ getEntries: () => entradas });
      }
      observe = (opcoes: unknown) => void observados.push(opcoes);
      disconnect = desconectar;
    }
    const CONVERSAO = "https://www.googleadservices.com/pagead/conversion/18460652540/?random=1";

    beforeEach(() => {
      entregar = undefined;
      observados = [];
      desconectar.mockClear();
      vi.useFakeTimers();
    });
    afterEach(() => {
      delete (window as { google_tag_manager?: unknown }).google_tag_manager;
      vi.unstubAllGlobals();
    });

    it("GTM pronto e requisição de conversão aos 300 ms: navega aos 450 ms (validação 2 do Tracking)", async () => {
      (window as { google_tag_manager?: unknown }).google_tag_manager = {};
      vi.stubGlobal("PerformanceObserver", ObservadorDeRecursos);
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
      vi.advanceTimersByTime(300);
      entregar!([{ name: CONVERSAO, startTime: performance.now() }]);
      vi.advanceTimersByTime(149);
      expect(navegar).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(navegar).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(4000);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it("GTM pronto sem requisição de conversão: navega no teto de 1.500 ms", async () => {
      (window as { google_tag_manager?: unknown }).google_tag_manager = {};
      vi.stubGlobal("PerformanceObserver", ObservadorDeRecursos);
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
      vi.advanceTimersByTime(1499);
      expect(navegar).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it("o eventCallback do GTM, mesmo cedo, não decide a navegação", async () => {
      (window as { google_tag_manager?: unknown }).google_tag_manager = {};
      vi.stubGlobal("PerformanceObserver", ObservadorDeRecursos);
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
      const evento = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
      (evento.eventCallback as (() => void) | undefined)?.();
      vi.advanceTimersByTime(22);
      expect(navegar).not.toHaveBeenCalled();
    });

    it("GTM não pronto: ignora o eventCallback e navega 150 ms depois da requisição de conversão", async () => {
      vi.stubGlobal("PerformanceObserver", ObservadorDeRecursos);
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      const antes = performance.now();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
      const evento = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
      expect(evento).not.toHaveProperty("eventCallback");
      expect(observados).toEqual([{ type: "resource", buffered: true }]);
      // Recurso anterior ao clique (buffered) e recurso sem o ID de conversão não contam.
      entregar!([
        { name: CONVERSAO, startTime: antes - 50 },
        { name: "https://www.google-analytics.com/g/collect?v=2", startTime: performance.now() + 1 },
      ]);
      vi.advanceTimersByTime(500);
      expect(navegar).not.toHaveBeenCalled();
      entregar!([{ name: CONVERSAO, startTime: performance.now() + 1 }]);
      vi.advanceTimersByTime(149);
      expect(navegar).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(navegar).toHaveBeenCalledTimes(1);
      expect(desconectar).toHaveBeenCalled();
      vi.advanceTimersByTime(4000);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it("page_view do ccm/collect com o ID não libera; só a conversão libera (R28, crítico)", async () => {
      vi.stubGlobal("PerformanceObserver", ObservadorDeRecursos);
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
      entregar!([
        { name: "https://www.google.com/ccm/collect?en=page_view&tid=AW-18460652540&dl=x", startTime: performance.now() + 1 },
        { name: "https://www.google.com/pagead/landing?gclid=x&id=18460652540", startTime: performance.now() + 1 },
        { name: "https://www.google.com/ccm/collect?en=conversion&tid=AW-99999999999", startTime: performance.now() + 1 },
        { name: "https://www.googleadservices.com/pagead/conversion/99999999999/?label=18460652540", startTime: performance.now() + 1 },
      ]);
      vi.advanceTimersByTime(500);
      expect(navegar).not.toHaveBeenCalled();
      entregar!([{ name: "https://www.google.com/ccm/collect?en=conversion&tid=AW-18460652540&dl=x", startTime: performance.now() + 1 }]);
      vi.advanceTimersByTime(150);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it("reconhece as outras formas da conversão (1p-conversion e ccm/collect com o ID)", async () => {
      vi.stubGlobal("PerformanceObserver", ObservadorDeRecursos);
      const { track } = await import("./analytics");
      for (const nome of [
        "https://www.google.com/pagead/1p-conversion/18460652540/?x=1",
        "https://www.google.com/ccm/collect?en=conversion&tid=AW-18460652540",
      ]) {
        const navegar = vi.fn();
        track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
        entregar!([{ name: nome, startTime: performance.now() + 1 }]);
        vi.advanceTimersByTime(150);
        expect(navegar).toHaveBeenCalledTimes(1);
      }
    });

    it("GTM não pronto sem a requisição de conversão: teto de 4.000 ms", async () => {
      vi.stubGlobal("PerformanceObserver", ObservadorDeRecursos);
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
      vi.advanceTimersByTime(3999);
      expect(navegar).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it("sem PerformanceObserver, usa só o teto de 4.000 ms", async () => {
      vi.stubGlobal("PerformanceObserver", undefined);
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
      vi.advanceTimersByTime(3999);
      expect(navegar).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it("gtmProntoNoClique vale sobre o estado de agora: GTM presente, mas ausente no clique, teto de 4.000 ms (R29)", async () => {
      vi.stubGlobal("PerformanceObserver", undefined);
      (window as { google_tag_manager?: unknown }).google_tag_manager = {};
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar, inicioMs: performance.now() - 1600, gtmProntoNoClique: false });
      vi.advanceTimersByTime(2399);
      expect(navegar).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it("com inicioMs, o prazo conta do clique original e nunca passa do teto; vencido, navega na hora (R28, item 4)", async () => {
      vi.stubGlobal("PerformanceObserver", undefined);
      const { track } = await import("./analytics");
      const perto = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: perto, inicioMs: performance.now() - 2500 });
      vi.advanceTimersByTime(1499);
      expect(perto).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(perto).toHaveBeenCalledTimes(1);
      const passou = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: passou, inicioMs: performance.now() - 4400 });
      expect(window.dataLayer!.filter((e) => e.event === "clique_whatsapp").length).toBeGreaterThan(0);
      expect(passou).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(4000);
      expect(passou).toHaveBeenCalledTimes(1);
    });
  });

  describe("detector no clique tardio (validação 3 do Tracking, observação 1)", () => {
    let entradas: Array<{ name: string; startTime: number; entryType: string }> = [];
    let relogio = 1000;
    const CONV = "https://www.googleadservices.com/pagead/conversion/18460652540/?en=conversion";

    beforeEach(() => {
      entradas = [];
      relogio = 1000;
      vi.useFakeTimers();
      // Relógio que anda a cada leitura: distingue "antes do push" de "depois do push".
      vi.spyOn(performance, "now").mockImplementation(() => ++relogio);
      (window as { google_tag_manager?: unknown }).google_tag_manager = {};
      // A tag do Ads começa a conversão de forma síncrona, dentro do push do clique_whatsapp.
      const fila: Record<string, unknown>[] = [];
      fila.push = function (...itens: Record<string, unknown>[]) {
        if (itens.some((item) => item.event === "clique_whatsapp")) entradas.push({ name: CONV, startTime: performance.now(), entryType: "resource" });
        return Array.prototype.push.apply(this, itens);
      };
      window.dataLayer = fila;
    });
    afterEach(() => {
      delete (window as { google_tag_manager?: unknown }).google_tag_manager;
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("entrada iniciada dentro do push, antes de o observador existir, chega pelo buffered e libera a navegação", async () => {
      class ObservadorComBuffer {
        constructor(private retorno: (lista: { getEntries: () => unknown[] }) => void) {}
        observe(opcoes: { buffered?: boolean }) {
          if (opcoes.buffered) setTimeout(() => this.retorno({ getEntries: () => [...entradas] }), 20);
        }
        disconnect() {}
      }
      vi.stubGlobal("PerformanceObserver", ObservadorComBuffer);
      vi.spyOn(performance, "getEntriesByType").mockImplementation(() => []);
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
      expect(entradas).toHaveLength(1);
      vi.advanceTimersByTime(20 + 150);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it("buffer cheio (observador não entrega): a varredura de getEntriesByType a cada 50 ms acha a conversão", async () => {
      class ObservadorMudo {
        observe() {}
        disconnect() {}
      }
      vi.stubGlobal("PerformanceObserver", ObservadorMudo);
      vi.spyOn(performance, "getEntriesByType").mockImplementation(() => [...entradas] as unknown as PerformanceEntryList);
      const { track } = await import("./analytics");
      const navegar = vi.fn();
      track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir: navegar });
      vi.advanceTimersByTime(50 + 149);
      expect(navegar).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(navegar).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(4000);
      expect(navegar).toHaveBeenCalledTimes(1);
    });
  });
});
