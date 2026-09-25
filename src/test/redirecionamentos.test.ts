import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface Redirecionamento {
  source: string;
  destination: string;
  statusCode?: number;
  permanent?: boolean;
  has?: Array<{ type: string; value: string }>;
}

const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")) as { redirects: Redirecionamento[] };

/** Qual regra casa com o host (a Vercel compara o valor do host inteiro). */
const regraPara = (host: string) => config.redirects.find((r) => r.has?.some((h) => h.type === "host" && new RegExp(`^${h.value}$`).test(host)));

describe("vercel.json: domínio principal e 301", () => {
  it("www e o endereço antigo da Vercel vão para o domínio principal, com 301 e o caminho", () => {
    for (const host of ["www.drpatricksantos.com.br", "lp-dr-santos.vercel.app"]) {
      const regra = regraPara(host)!;
      expect(regra).toBeDefined();
      expect(regra.source).toBe("/:path*");
      expect(regra.destination).toBe("https://drpatricksantos.com.br/:path*");
      expect(regra.statusCode).toBe(301);
      expect(regra.permanent).toBeUndefined();
      // A query (gclid) segue sozinha: o destino não define query própria.
      expect(regra.destination).not.toContain("?");
    }
  });

  it("o domínio principal e os previews com hash não redirecionam", () => {
    for (const host of [
      "drpatricksantos.com.br",
      "lp-dr-santos-gi12memhl-oandrelopesz1.vercel.app",
      "lp-dr-santos-git-fix-lgpd-oandrelopesz1.vercel.app",
    ]) {
      expect(regraPara(host)).toBeUndefined();
    }
  });

  it("só estes dois redirecionamentos existem", () => {
    expect(config.redirects).toHaveLength(2);
  });
});
