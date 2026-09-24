import { beforeEach, describe, expect, it } from "vitest";
import { marcosAtingidos, observarProfundidade } from "./profundidade";

describe("profundidade", () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it("calcula os marcos pela fração rolada", () => {
    expect(marcosAtingidos(0.1)).toEqual([]);
    expect(marcosAtingidos(0.5)).toEqual([25, 50]);
    expect(marcosAtingidos(0.95)).toEqual([25, 50, 75, 90]);
  });

  it("envia cada marco uma vez só", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2000 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    const parar = observarProfundidade();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 600 });
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    parar();
    const eventos = window.dataLayer!.filter((e) => e.event === "profundidade_rolagem");
    expect(eventos.map((e) => e.percentual)).toEqual([25, 50]);
  });
});
