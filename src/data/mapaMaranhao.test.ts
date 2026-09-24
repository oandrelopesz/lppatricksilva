import { describe, expect, it } from "vitest";
import { CIDADES } from "./locais";
import { MAPA_MA, PONTOS_CIDADES } from "./mapaMaranhao";

describe("mapaMaranhao", () => {
  it("tem um ponto por cidade, com os mesmos ids de locais.ts", () => {
    expect(Object.keys(PONTOS_CIDADES)).toHaveLength(11);
    expect(new Set(Object.keys(PONTOS_CIDADES)).size).toBe(11);
    expect(Object.keys(PONTOS_CIDADES).sort()).toEqual(CIDADES.map((cidade) => cidade.id).sort());
  });

  it("mantém todos os pontos dentro do viewBox", () => {
    const [x0, y0, largura, altura] = MAPA_MA.viewBox.split(" ").map(Number);
    for (const { x, y } of Object.values(PONTOS_CIDADES)) {
      expect(x).toBeGreaterThanOrEqual(x0);
      expect(x).toBeLessThanOrEqual(x0 + largura);
      expect(y).toBeGreaterThanOrEqual(y0);
      expect(y).toBeLessThanOrEqual(y0 + altura);
    }
  });

  it("tem contorno não vazio começando por M", () => {
    expect(MAPA_MA.contorno.length).toBeGreaterThan(0);
    expect(MAPA_MA.contorno.startsWith("M")).toBe(true);
  });

  it("cita a fonte do IBGE", () => {
    expect(MAPA_MA.fonte).toContain("IBGE");
  });
});