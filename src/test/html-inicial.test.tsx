import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import App from "@/App";
import { ASSINATURA } from "@/config";
import { todosOsLocais } from "@/data/locais";
import { render } from "@/entry-server";
import { TEXTOS_FAQ } from "@/content/faq";
import { TEXTOS_COOKIES } from "@/content/cookies";
import { TEXTOS_ONDE_ATENDE } from "@/content/ondeAtende";
import { LINK_WHATSAPP_BASE } from "@/lib/whatsapp";

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
    for (const id of ["inicio", "para-quem", "como-funciona", "sobre", "onde-atende", "duvidas", "agendar", "rodape"]) {
      expect(html).toContain(`id="${id}"`);
    }
    for (const item of TEXTOS_FAQ.itens) {
      expect(html).toContain(item.resposta.replace(/&/g, "&amp;").replace(/"/g, "&quot;"));
    }
    expect((html.match(/role="region"/g) || [])).toHaveLength(11);
    expect(html).toContain('href="/politica-de-privacidade.html"');
  });

  it("sem JavaScript: nem aviso nem botão de cookies (controle sem ação), só o link da política (parecer R18)", () => {
    expect(html).not.toContain(TEXTOS_COOKIES.rotulo);
    expect(html).not.toContain(TEXTOS_COOKIES.preferencias);
    expect(html).toContain('href="/politica-de-privacidade.html"');
  });

  it("sem JavaScript, a lista dos 14 locais fica visível, com Como chegar e CTA base (parecer R15)", () => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const lista = doc.querySelector(".abas-cidades__geral")!;
    expect(lista).not.toBeNull();
    expect(lista.hasAttribute("hidden")).toBe(false);
    for (let pai: Element | null = lista.parentElement; pai; pai = pai.parentElement) {
      expect(pai.hasAttribute("hidden")).toBe(false);
    }
    expect(lista.className).not.toMatch(/\b(hidden|sr-only|invisible)\b/);
    const itens = lista.querySelectorAll("li");
    expect(itens).toHaveLength(14);
    for (const { cidade, local } of todosOsLocais()) {
      const item = [...itens].find((li) => li.textContent!.includes(local.nome))!;
      expect(item.textContent).toContain(local.endereco);
      expect(item.querySelector(`a[href="${local.linkComoChegar}"]`)).not.toBeNull();
      const cta = [...item.querySelectorAll("a")].find((a) => a.getAttribute("href")!.startsWith("https://wa.me/"))!;
      expect(cta.getAttribute("href")).toBe(LINK_WHATSAPP_BASE);
      expect(cta.textContent).toBe(TEXTOS_ONDE_ATENDE.clinica.cta(cidade.nome));
    }
  });

  it("hidrata o HTML do servidor sem divergência e só então esconde a lista geral (parecer R15)", async () => {
    const erros = vi.spyOn(console, "error").mockImplementation(() => {});
    const raiz = document.createElement("div");
    raiz.innerHTML = html;
    document.body.append(raiz);
    expect(raiz.querySelector(".abas-cidades__geral")!.hasAttribute("hidden")).toBe(false);
    await act(async () => {
      hydrateRoot(raiz, <App />);
    });
    expect(erros).not.toHaveBeenCalled();
    expect(raiz.querySelector(".abas-cidades__geral")!.hasAttribute("hidden")).toBe(true);
    erros.mockRestore();
    raiz.remove();
  });
});
