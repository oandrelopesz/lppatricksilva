import { beforeEach, describe, expect, it, vi } from "vitest";
import { marcosAtingidos, observarProfundidade, reiniciarProfundidadeParaTestes } from "./profundidade";

function rolarAte(y: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  window.dispatchEvent(new Event("scroll"));
}

const enviados = () => window.dataLayer!.filter((e) => e.event === "profundidade_rolagem").map((e) => e.percentual);

describe("profundidade", () => {
  beforeEach(() => {
    window.dataLayer = [];
    sessionStorage.clear();
    reiniciarProfundidadeParaTestes();
    vi.restoreAllMocks();
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2000 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
  });

  it("calcula os marcos pela fração rolada", () => {
    expect(marcosAtingidos(0.1)).toEqual([]);
    expect(marcosAtingidos(0.5)).toEqual([25, 50]);
    expect(marcosAtingidos(0.95)).toEqual([25, 50, 75, 90]);
  });

  it("envia cada marco uma vez só", () => {
    const parar = observarProfundidade();
    rolarAte(600);
    rolarAte(600);
    parar();
    expect(enviados()).toEqual([25, 50]);
  });

  it("duas inscrições na mesma sessão (recarregamento) não repetem marcos", () => {
    const primeira = observarProfundidade();
    rolarAte(600);
    primeira();
    reiniciarProfundidadeParaTestes(); // simula nova carga da página: só o sessionStorage sobrevive
    const segunda = observarProfundidade();
    rolarAte(1000);
    segunda();
    expect(enviados()).toEqual([25, 50, 75, 90]);
    expect(JSON.parse(sessionStorage.getItem("lp_profundidade_v1")!)).toEqual([25, 50, 75, 90]);
  });

  it("com sessionStorage bloqueado, deduplica em memória", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    const primeira = observarProfundidade();
    rolarAte(600);
    primeira();
    const segunda = observarProfundidade();
    rolarAte(600);
    segunda();
    expect(enviados()).toEqual([25, 50]);
  });
});
