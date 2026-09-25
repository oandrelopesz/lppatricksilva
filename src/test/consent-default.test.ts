import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const html = fs.readFileSync(path.resolve(import.meta.dirname, "../../index.html"), "utf8");
const inicio = html.indexOf("gtag('consent', 'default'");
const scriptInicial = html.slice(html.lastIndexOf("<script>", inicio) + "<script>".length, html.indexOf("</script>", inicio));

/** Roda o script do consentimento com um localStorage de mentira e devolve os comandos do dataLayer. */
function rodar(armazenado: Record<string, string>) {
  const dataLayer: unknown[] = [];
  const armazenamento = { getItem: (chave: string) => armazenado[chave] ?? null };
  new Function("window", "localStorage", "dataLayer", scriptInicial)({ dataLayer }, armazenamento, dataLayer);
  return dataLayer.map((args) => Array.from(args as ArrayLike<unknown>));
}

const updates = (comandos: unknown[][]) => comandos.filter((c) => c[0] === "consent" && c[1] === "update").map((c) => c[2]);

describe("index.html: Consent Mode v2 (modo avançado)", () => {
  it("define o consentimento negado e ads_data_redaction antes de qualquer outro script", () => {
    expect(inicio).toBeGreaterThan(-1);
    expect(inicio).toBeLessThan(html.indexOf("</head>"));
    expect(inicio).toBeLessThan(html.indexOf('<script type="module"'));
    for (const sinal of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) {
      expect(scriptInicial).toContain(`${sinal}: 'denied'`);
    }
    expect(scriptInicial).toContain("wait_for_update: 500");
    expect(scriptInicial).toContain("gtag('set', 'ads_data_redaction', true)");
  });

  it("sem escolha, fica só o padrão negado", () => {
    expect(updates(rodar({}))).toEqual([]);
  });

  it("aplica a escolha por categoria guardada, com personalização sempre negada", () => {
    const registro = (visitas: boolean, anuncios: boolean) => ({ lp_consentimento_v2: JSON.stringify({ visitas, anuncios, versao: "2026-09-25", data: "2026-09-25T10:00:00.000Z" }) });
    expect(updates(rodar(registro(true, false)))).toEqual([{ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
    expect(updates(rodar(registro(false, true)))).toEqual([{ analytics_storage: "denied", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" }]);
    expect(updates(rodar(registro(false, false)))).toEqual([]);
  });

  it("migra a escolha antiga: aceito liga as duas; recusado não libera nada", () => {
    expect(updates(rodar({ lp_consentimento_v1: "aceito" }))).toEqual([{ analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" }]);
    expect(updates(rodar({ lp_consentimento_v1: "recusado" }))).toEqual([]);
  });

  it("registro corrompido não quebra nem libera nada", () => {
    expect(updates(rodar({ lp_consentimento_v2: "{quebrado" }))).toEqual([]);
    expect(updates(rodar({ lp_consentimento_v2: JSON.stringify({ visitas: "sim", anuncios: 1 }) }))).toEqual([]);
  });
});
