import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/entry-server";

/**
 * Ordem da carga (spec §8 e §21): 1. limpeza do endereço, 2. pagina_limpa, 3. agendamento do GTM,
 * 4. navegação por seções, num efeito depois da hidratação. A navegação é simulada para registrar
 * o estado da página no momento em que ela começa.
 */
const estado = vi.hoisted(() => ({
  chamadas: 0,
  noMomento: undefined as undefined | { busca: string; paginasLimpas: number; gtmAgendado: boolean; hidratado: boolean },
  interacoes: [] as string[],
}));

vi.mock("@/lib/navegacaoSecoes", async (original) => ({
  ...(await original<typeof import("@/lib/navegacaoSecoes")>()),
  iniciarNavegacaoPorSecoes: () => {
    estado.chamadas++;
    estado.noMomento ??= {
      busca: window.location.search,
      paginasLimpas: (window.dataLayer ?? []).filter((e) => "pagina_limpa" in e).length,
      gtmAgendado: estado.interacoes.includes("pointerdown"),
      hidratado: document.getElementById("root")!.hasChildNodes(),
    };
    return () => {};
  },
}));

describe("main.tsx: ordem da carga", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
    document.body.innerHTML = "";
  });

  it("limpa o endereço, põe o pagina_limpa e agenda o GTM antes de a navegação por seções começar", async () => {
    window.history.replaceState(null, "", "/sobre?utm_source=google&utm_term=dor+no+joelho&gclid=abc.1");
    window.dataLayer = [];
    const adicionar = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation((tipo: string, ...resto: unknown[]) => {
      estado.interacoes.push(tipo);
      return (adicionar as (...a: unknown[]) => void)(tipo, ...resto);
    });
    const erros = vi.spyOn(console, "error").mockImplementation(() => {});
    document.body.innerHTML = `<div id="root">${render()}</div>`;

    await import("./main");
    // Logo depois do import (síncrono), a medição já rodou e a navegação ainda não.
    expect(estado.chamadas).toBe(0);
    expect(window.location.search).toBe("?utm_source=google&gclid=abc.1");

    await vi.waitFor(() => expect(estado.chamadas).toBeGreaterThan(0));
    expect(estado.noMomento).toEqual({
      busca: "?utm_source=google&gclid=abc.1",
      paginasLimpas: 1,
      gtmAgendado: true,
      hidratado: true,
    });
    expect(window.dataLayer![0]).toEqual({ pagina_limpa: `${location.origin}/sobre?utm_source=google` });
    expect(erros).not.toHaveBeenCalled();
  });
});
