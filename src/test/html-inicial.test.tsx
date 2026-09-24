import { describe, expect, it } from "vitest";
import { ASSINATURA } from "@/config";
import { todosOsLocais } from "@/data/locais";
import { render } from "@/entry-server";
import { TEXTOS_FAQ } from "@/content/faq";
import { TEXTOS_COOKIES } from "@/content/cookies";

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

  it("tem topbar de particular, assinatura completa e link para os locais", () => {
    expect(html).toContain(ASSINATURA);
    expect(html.toLowerCase()).toContain("particular");
    expect(html).toContain('href="#onde-atende"');
    expect(html).toContain('fetchpriority="high"');
    expect(html).not.toMatch(/\bBMA\b|Instituto Patrick Santos/);
  });

  it("tem as âncoras de todas as seções e as 11 respostas do FAQ", () => {
    for (const id of ["para-quem", "como-funciona", "sobre", "onde-atende", "duvidas", "rodape"]) {
      expect(html).toContain(`id="${id}"`);
    }
    for (const item of TEXTOS_FAQ.itens) {
      expect(html).toContain(item.resposta.replace(/&/g, "&amp;").replace(/"/g, "&quot;"));
    }
    expect((html.match(/role="region"/g) || [])).toHaveLength(11);
    expect(html).toContain('href="/politica-de-privacidade.html"');
  });

  it("não traz o aviso de cookies (só aparece depois da hidratação) e traz o botão de preferências", () => {
    expect(html).not.toContain(TEXTOS_COOKIES.rotulo);
    expect(html).toContain(TEXTOS_COOKIES.preferencias);
  });
});
