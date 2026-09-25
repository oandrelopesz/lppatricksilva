import { describe, expect, it } from "vitest";
import { apagarCookiesRevogados } from "./cookiesMedicao";

/** document de mentira: lê os cookies dados e registra cada gravação. */
function documentoFalso(cookies: string) {
  const gravacoes: string[] = [];
  const doc = {
    get cookie() {
      return cookies;
    },
    set cookie(valor: string) {
      gravacoes.push(valor);
    },
  };
  return { doc, gravacoes };
}

const EXISTENTES = "_ga=GA1.1.1; _ga_ABC123=GS1.1; _gcl_au=1.1; _gcl_aw=GCL.1; _gcl_dc=x; _gcl_gb=y; _gcl_gs=z; outro=1; _gac_x=2";
const apagados = (gravacoes: string[]) => [...new Set(gravacoes.map((g) => g.split("=")[0]))].sort();

describe("apagarCookiesRevogados", () => {
  it("visitas revogada: apaga _ga e _ga_*, no domínio atual e nos pais", () => {
    const { doc, gravacoes } = documentoFalso(EXISTENTES);
    apagarCookiesRevogados({ visitas: false, anuncios: true }, doc, "www.lp.exemplo.com.br");
    expect(apagados(gravacoes)).toEqual(["_ga", "_ga_ABC123"]);
    const doGa = gravacoes.filter((g) => g.startsWith("_ga="));
    expect(doGa.every((g) => g.includes("expires=Thu, 01 Jan 1970 00:00:00 GMT") && g.includes("path=/"))).toBe(true);
    expect(doGa.some((g) => !g.includes("domain="))).toBe(true);
    for (const dominio of ["www.lp.exemplo.com.br", ".www.lp.exemplo.com.br", ".lp.exemplo.com.br", ".exemplo.com.br", ".com.br"]) {
      expect(doGa.some((g) => g.endsWith(`domain=${dominio}`))).toBe(true);
    }
  });

  it("anúncios revogada: apaga só os _gcl_ da lista", () => {
    const { doc, gravacoes } = documentoFalso(EXISTENTES);
    apagarCookiesRevogados({ visitas: true, anuncios: false }, doc, "lp-dr-santos.vercel.app");
    expect(apagados(gravacoes)).toEqual(["_gcl_au", "_gcl_aw", "_gcl_dc", "_gcl_gb", "_gcl_gs"]);
    expect(gravacoes.some((g) => g.endsWith("domain=.vercel.app"))).toBe(true);
  });

  it("anúncios revogada: reconhece qualquer _gcl_ legível, inclusive um nome novo (parecer R37, B4)", () => {
    const { doc, gravacoes } = documentoFalso("_gcl_xyz=1; _gcl_au=2; _gclx=3; gcl_au=4; _ga=5");
    apagarCookiesRevogados({ visitas: true, anuncios: false }, doc, "lp-dr-santos.vercel.app");
    expect(apagados(gravacoes)).toEqual(["_gcl_au", "_gcl_xyz"]);
    expect(gravacoes.filter((g) => g.startsWith("_gcl_xyz=")).every((g) => g.includes("path=/"))).toBe(true);
    expect(gravacoes.some((g) => g.startsWith("_gcl_xyz=") && g.endsWith("domain=.vercel.app"))).toBe(true);
  });

  it("as duas aceitas: não apaga nada", () => {
    const { doc, gravacoes } = documentoFalso(EXISTENTES);
    apagarCookiesRevogados({ visitas: true, anuncios: true }, doc, "lp-dr-santos.vercel.app");
    expect(gravacoes).toEqual([]);
  });

  it("nunca mexe em cookies de terceiros ou de outras finalidades", () => {
    const { doc, gravacoes } = documentoFalso(EXISTENTES);
    apagarCookiesRevogados({ visitas: false, anuncios: false }, doc, "localhost");
    expect(apagados(gravacoes)).not.toContain("outro");
    expect(apagados(gravacoes)).not.toContain("_gac_x");
  });

  it("apaga de verdade no cookie do navegador (jsdom)", () => {
    document.cookie = "_ga=GA1.1.1; path=/";
    document.cookie = "_gcl_au=1.1; path=/";
    document.cookie = "outro=1; path=/";
    apagarCookiesRevogados({ visitas: false, anuncios: false });
    expect(document.cookie).not.toContain("_ga=");
    expect(document.cookie).not.toContain("_gcl_au=");
    expect(document.cookie).toContain("outro=1");
    document.cookie = "outro=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });
});
