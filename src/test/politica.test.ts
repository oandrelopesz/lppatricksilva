import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("política de privacidade", () => {
  it("inclui as 11 seções da minuta, retorno à LP e nenhuma fonte editorial ou placeholder visível", () => {
    const html = readFileSync(resolve(process.cwd(), "public/politica-de-privacidade.html"), "utf8");
    expect(html).toContain("<!-- Minuta para revisão jurídica -->");
    expect(html).toContain('href="/"');
    expect((html.match(/<h2\b/g) || [])).toHaveLength(11);
    expect(html).toContain("O controlador dos dados é o Dr. Patrick Santos");
    expect(html).not.toMatch(/\[fonte:|\[PREENCHER\]|\{data da publicação\}/);
  });
});
