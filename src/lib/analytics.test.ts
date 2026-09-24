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

  it("track com aoConcluir chama uma vez só (callback do GTM e tempo-limite)", async () => {
    vi.useFakeTimers();
    const { track } = await import("./analytics");
    const aoConcluir = vi.fn();
    track("clique_whatsapp", { local_cta: "hero" }, { aoConcluir });
    const item = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
    (item.eventCallback as () => void)();
    vi.advanceTimersByTime(1000);
    expect(aoConcluir).toHaveBeenCalledTimes(1);
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
});
