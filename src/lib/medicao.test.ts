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
    iniciarMedicao();
    iniciarMedicao();
    expect(adicionar.mock.calls.filter(([tipo]) => tipo === "scroll")).toHaveLength(1);
    expect(window.dataLayer!.filter((e) => "pagina_limpa" in e)).toHaveLength(1);
  });
});
