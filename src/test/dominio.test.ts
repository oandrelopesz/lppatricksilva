import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/config";
import { gerarJsonLd, jsonLdComoTexto } from "@/data/jsonld";
import { render } from "@/entry-server";

describe("domínio definitivo (drpatricksantos.com.br)", () => {
  it("SITE_URL é o domínio principal, sem barra no fim", () => {
    expect(SITE_URL).toBe("https://drpatricksantos.com.br");
  });

  it("o JSON-LD usa só o domínio principal nas URLs e nos @id", () => {
    const grafo = gerarJsonLd()["@graph"] as Array<Record<string, unknown>>;
    for (const no of grafo) expect(String(no["@id"])).toMatch(/^https:\/\/drpatricksantos\.com\.br\/#/);
    expect(jsonLdComoTexto()).not.toContain("vercel.app");
  });

  it("o HTML renderizado não tem o endereço antigo", () => {
    expect(render()).not.toContain("lp-dr-santos.vercel.app");
  });
});
