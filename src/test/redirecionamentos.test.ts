import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")) as Record<string, unknown>;

describe("vercel.json: redirecionamento de domínio fica no painel da Vercel", () => {
  it("não tem regra por host (www e lp-dr-santos.vercel.app vão em Settings > Domains)", () => {
    const regras = [config.redirects, config.rewrites, config.routes].flatMap((lista) => (Array.isArray(lista) ? lista : []));
    const porHost = regras.filter((r: { has?: Array<{ type: string }> }) => r.has?.some((h) => h.type === "host"));
    expect(porHost).toEqual([]);
    expect(JSON.stringify(config)).not.toMatch(/drpatricksantos|vercel\.app"/);
  });
});
