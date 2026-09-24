import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const html = fs.readFileSync(path.resolve(import.meta.dirname, "../../index.html"), "utf8");

describe("index.html: Consent Mode v2", () => {
  it("define o consentimento negado e ads_data_redaction antes de qualquer outro script", () => {
    const inicio = html.indexOf("gtag('consent', 'default'");
    expect(inicio).toBeGreaterThan(-1);
    expect(inicio).toBeLessThan(html.indexOf("</head>"));
    expect(inicio).toBeLessThan(html.indexOf('<script type="module"'));
    const bloco = html.slice(inicio, html.indexOf("</script>", inicio));
    for (const sinal of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) {
      expect(bloco).toContain(`${sinal}: 'denied'`);
    }
    expect(bloco).toContain("wait_for_update: 500");
    expect(bloco).toContain("gtag('set', 'ads_data_redaction', true)");
    expect(bloco).toContain("lp_consentimento_v1");
  });
});
