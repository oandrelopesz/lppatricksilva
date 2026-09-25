import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Estado ocupado do CTA do WhatsApp (parecer R28, item 5): contraste do texto de pelo menos 4,5:1. */
const css = fs.readFileSync(path.resolve(__dirname, "../styles/global.css"), "utf8");
const tokens = fs.readFileSync(path.resolve(__dirname, "../styles/tokens.css"), "utf8");

const cor = (nome: string) => tokens.match(new RegExp(`--color-${nome}:\\s*(#[0-9a-fA-F]{6})`))![1];
function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contraste = (a: string, b: string) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const regras = [...css.matchAll(/([^{}]*\.cta-aguardando[^{}]*)\{([^}]*)\}/g)].map(([, seletor, corpo]) => ({ seletor: seletor.trim(), corpo }));

describe("CTA ocupado (cta-aguardando)", () => {
  it("não usa opacidade (derrubava o texto branco no verde para 3,21:1)", () => {
    expect(regras.length).toBeGreaterThan(0);
    for (const { corpo } of regras) expect(corpo).not.toMatch(/opacity/);
  });

  it("nos CTAs verdes, escurece o fundo mantendo o texto branco acima de 4,5:1", () => {
    const fundo = regras.find(({ seletor, corpo }) => /bg-cta/.test(seletor) && /background/.test(corpo));
    expect(fundo?.corpo).toContain("var(--color-cta-escuro)");
    expect(contraste("#ffffff", cor("cta-escuro"))).toBeGreaterThanOrEqual(4.5);
  });

  it("mostra cursor de progresso e um indicador decorativo sem texto", () => {
    expect(regras.some(({ corpo }) => /cursor:\s*progress/.test(corpo))).toBe(true);
    const indicador = regras.find(({ seletor }) => seletor.includes("::after"));
    expect(indicador?.corpo).toMatch(/content:\s*""/);
  });
});
