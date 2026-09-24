import { describe, expect, it } from "vitest";
import { todosOsLocais } from "@/data/locais";
import { render } from "@/entry-server";

describe("HTML inicial (sem JavaScript)", () => {
  const html = render();

  it("tem os 14 locais com nome, endereço e link 'Como chegar'", () => {
    for (const { local } of todosOsLocais()) {
      expect(html).toContain(local.nome);
      expect(html).toContain(local.endereco);
      expect(html).toContain(local.linkComoChegar.replace(/&/g, "&amp;"));
    }
  });

  it("tem a âncora de onde atende e nenhum iframe", () => {
    expect(html).toContain('id="onde-atende"');
    expect(html).not.toContain("<iframe");
  });

  it("tem CTA com o link base do WhatsApp", () => {
    expect(html).toMatch(/href="https:\/\/wa\.me\/5513996822680\?text=/);
  });
});
