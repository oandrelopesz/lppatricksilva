import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rolarParaSecaoDaUrl } from "./navegacaoSecoes";
import { SECOES } from "./secoes";

describe("navegação por seções", () => {
  beforeEach(() => {
    document.body.innerHTML = SECOES.map((slug) => `<section id="${slug}"><a href="#${slug}">${slug}</a></section>`).join("");
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  describe("carga (item 3)", () => {
    it("em /onde-atende rola até #onde-atende sem animação", () => {
      window.history.replaceState(null, "", "/onde-atende");
      rolarParaSecaoDaUrl();
      const alvo = document.getElementById("onde-atende")!;
      expect(alvo.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(alvo.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
    });

    it("na raiz não rola", () => {
      window.history.replaceState(null, "", "/?utm_source=google");
      rolarParaSecaoDaUrl();
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
