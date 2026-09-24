import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pasta = path.resolve(process.cwd(), "public/img");
const NOMES = ["hero", "sobre", "consulta", "cta-final"];
const LARGURAS = [480, 720, 960, 1280];
const FORMATOS = ["avif", "webp"];

describe("imagens geradas", () => {
  for (const nome of NOMES)
    for (const largura of LARGURAS)
      for (const formato of FORMATOS)
        it(`existe ${nome}-${largura}.${formato}`, () => {
          expect(fs.existsSync(path.join(pasta, `${nome}-${largura}.${formato}`))).toBe(true);
        });

  it("hero AVIF 720 cabe no orçamento de 70 KB", () => {
    expect(fs.statSync(path.join(pasta, "hero-720.avif")).size).toBeLessThanOrEqual(70 * 1024);
  });
});
