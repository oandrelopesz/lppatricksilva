import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("iniciarMedicao", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv("VITE_GTM_ID", "GTM-TESTE01");
    window.dataLayer = [];
    sessionStorage.clear();
    document.head.querySelectorAll("script[data-gtm]").forEach((s) => s.remove());
    (window as { requestIdleCallback?: unknown }).requestIdleCallback = undefined;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("põe pagina_limpa na fila antes do GTM e só carrega o GTM depois", async () => {
    const { iniciarMedicao } = await import("./medicao");
    iniciarMedicao();
    expect(window.dataLayer![0]).toHaveProperty("pagina_limpa");
    expect(document.head.querySelector("script[data-gtm]")).toBeNull();
    vi.advanceTimersByTime(1500);
    const iPagina = window.dataLayer!.findIndex((e) => "pagina_limpa" in e);
    const iGtm = window.dataLayer!.findIndex((e) => e.event === "gtm.js");
    expect(iPagina).toBeGreaterThanOrEqual(0);
    expect(iGtm).toBeGreaterThan(iPagina);
  });

  it("chamada duas vezes, instala uma vez só (um listener de rolagem, um pagina_limpa)", async () => {
    const adicionar = vi.spyOn(window, "addEventListener");
    const { iniciarMedicao } = await import("./medicao");
    const ouvintesDeRolagem = () => adicionar.mock.calls.filter(([tipo]) => tipo === "scroll").length;
    iniciarMedicao();
    const depoisDaPrimeira = ouvintesDeRolagem();
    iniciarMedicao();
    expect(ouvintesDeRolagem()).toBe(depoisDaPrimeira);
    expect(window.dataLayer!.filter((e) => "pagina_limpa" in e)).toHaveLength(1);
  });

  /** Modelo do GTM: cada push sobrescreve as chaves; devolve o modelo no momento do evento pedido. */
  function modeloNoEvento(evento: string): Record<string, unknown> {
    const modelo: Record<string, unknown> = {};
    for (const push of window.dataLayer!) {
      Object.assign(modelo, push);
      if (push.event === evento) return modelo;
    }
    throw new Error(`evento ${evento} não encontrado`);
  }

  it("lp:secao atualiza o pagina_limpa sem evento nem page_view; o clique seguinte leva a URL nova (R20, decisão b)", async () => {
    window.history.replaceState(null, "", "/?utm_source=google&gclid=abc.1");
    const { iniciarMedicao } = await import("./medicao");
    const { track } = await import("./analytics");
    iniciarMedicao();
    expect(window.dataLayer![0]).toEqual({ pagina_limpa: `${location.origin}/?utm_source=google` });
    window.history.pushState(null, "", "/sobre?utm_source=google&gclid=abc.1&utm_term=dor+no+joelho#faq");
    window.dispatchEvent(new CustomEvent("lp:secao", { detail: { slug: "sobre", caminho: "/sobre" } }));
    const ultimo = window.dataLayer![window.dataLayer!.length - 1];
    expect(ultimo).toEqual({ pagina_limpa: `${location.origin}/sobre?utm_source=google` });
    expect(window.dataLayer!.some((e) => e.event === "page_view")).toBe(false);
    track("clique_whatsapp", { local_cta: "sobre" });
    expect(modeloNoEvento("clique_whatsapp").pagina_limpa).toBe(`${location.origin}/sobre?utm_source=google`);
    window.history.replaceState(null, "", "/");
  });

  it("limpa o endereço antes do pagina_limpa e antes de o GTM carregar (spec §8)", async () => {
    window.history.replaceState(null, "", "/?utm_source=google&utm_term=dor+no+joelho&gclid=abc.1&utm_campaign=joelho");
    const noMomento: Array<{ filas: number; gtm: boolean }> = [];
    const trocar = vi.spyOn(window.history, "replaceState").mockImplementation(function (this: History, ...args) {
      noMomento.push({ filas: window.dataLayer!.length, gtm: !!document.head.querySelector("script[data-gtm]") });
      return History.prototype.replaceState.apply(this, args as Parameters<History["replaceState"]>);
    });
    const { iniciarMedicao } = await import("./medicao");
    iniciarMedicao();
    vi.advanceTimersByTime(1500);
    trocar.mockRestore();
    expect(noMomento).toEqual([{ filas: 0, gtm: false }]);
    expect(window.dataLayer![0]).toEqual({ pagina_limpa: `${location.origin}/?utm_source=google` });
    expect(window.location.search).toBe("?utm_source=google&gclid=abc.1");
    expect(document.head.querySelector("script[data-gtm]")).not.toBeNull();
    window.history.replaceState(null, "", "/");
  });

  it("aumenta o buffer de resource timing na carga, para a conversão não ficar fora dele", async () => {
    const aumentar = vi.fn();
    const original = (performance as { setResourceTimingBufferSize?: unknown }).setResourceTimingBufferSize;
    (performance as { setResourceTimingBufferSize?: unknown }).setResourceTimingBufferSize = aumentar;
    try {
      const { iniciarMedicao } = await import("./medicao");
      iniciarMedicao();
      expect(aumentar).toHaveBeenCalledTimes(1);
      expect(aumentar.mock.calls[0][0]).toBeGreaterThanOrEqual(1000);
    } finally {
      (performance as { setResourceTimingBufferSize?: unknown }).setResourceTimingBufferSize = original;
    }
  });
});
