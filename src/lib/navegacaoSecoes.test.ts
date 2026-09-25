import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { acompanharRolagem, interceptarLinksDeSecao, rolarParaSecaoDaUrl } from "./navegacaoSecoes";
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

  describe("links internos (item 4)", () => {
    let desligar: () => void;
    beforeEach(() => {
      desligar = interceptarLinksDeSecao();
    });
    afterEach(() => desligar());

    const link = (slug: string) => document.querySelector<HTMLAnchorElement>(`a[href="#${slug}"]`)!;

    it("clique simples rola suave e empilha /<slug> no histórico", () => {
      const empilhar = vi.spyOn(window.history, "pushState");
      const seguiu = fireEvent.click(link("sobre"));
      expect(seguiu).toBe(false);
      expect(window.location.pathname).toBe("/sobre");
      expect(empilhar).toHaveBeenCalledTimes(1);
      expect(document.getElementById("sobre")!.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
      empilhar.mockRestore();
    });

    it("com prefers-reduced-motion, rola sem animação", () => {
      vi.stubGlobal("matchMedia", (consulta: string) => ({ matches: consulta.includes("reduce") }));
      fireEvent.click(link("duvidas"));
      expect(document.getElementById("duvidas")!.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
    });

    it("link para inicio volta à raiz", () => {
      window.history.replaceState(null, "", "/sobre");
      fireEvent.click(link("inicio"));
      expect(window.location.pathname).toBe("/");
    });

    it("clique com Ctrl não é interceptado", () => {
      const seguiu = fireEvent.click(link("sobre"), { ctrlKey: true });
      expect(seguiu).toBe(true);
      expect(window.location.pathname).toBe("/");
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });

    it("âncora que não é seção (ex.: #aba-tuntum) segue o navegador", () => {
      document.body.insertAdjacentHTML("beforeend", '<a href="#aba-tuntum">Tuntum</a>');
      const seguiu = fireEvent.click(document.querySelector('a[href="#aba-tuntum"]')!);
      expect(seguiu).toBe(true);
      expect(window.location.pathname).toBe("/");
    });

    it("clique já tratado por outro componente (defaultPrevented) não é interceptado", () => {
      link("sobre").addEventListener("click", (e) => e.preventDefault());
      fireEvent.click(link("sobre"));
      expect(window.location.pathname).toBe("/");
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });

    it("voltar no histórico rola até a seção da URL", () => {
      window.history.replaceState(null, "", "/duvidas");
      window.dispatchEvent(new PopStateEvent("popstate"));
      expect(document.getElementById("duvidas")!.scrollIntoView).toHaveBeenCalled();
    });

    it("desligar remove o listener", () => {
      desligar();
      const seguiu = fireEvent.click(link("sobre"));
      expect(seguiu).toBe(true);
      desligar = () => {};
    });
  });

  describe("rolagem (item 5)", () => {
    let retorno: IntersectionObserverCallback | undefined;
    let observados: Element[] = [];
    const desconectar = vi.fn();
    class ObservadorFalso {
      constructor(r: IntersectionObserverCallback) {
        retorno = r;
      }
      observe = (alvo: Element) => void observados.push(alvo);
      unobserve = vi.fn();
      disconnect = desconectar;
    }
    const cruzar = (slug: string, entrou = true) =>
      retorno!([{ target: document.getElementById(slug)!, isIntersecting: entrou } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    let desligar: () => void;
    beforeEach(() => {
      observados = [];
      retorno = undefined;
      desconectar.mockClear();
      vi.stubGlobal("IntersectionObserver", ObservadorFalso);
      vi.useFakeTimers();
      desligar = acompanharRolagem();
    });
    afterEach(() => {
      desligar();
      vi.useRealTimers();
    });

    it("observa as seções que existem na página", () => {
      expect(observados.map((e) => e.id)).toEqual([...SECOES]);
    });

    it("a seção dominante vira /<slug> com replaceState, sem empilhar, depois do throttle", () => {
      const empilhar = vi.spyOn(window.history, "pushState");
      const trocar = vi.spyOn(window.history, "replaceState");
      cruzar("como-funciona");
      cruzar("sobre");
      cruzar("duvidas");
      expect(window.location.pathname).toBe("/");
      vi.advanceTimersByTime(300);
      expect(window.location.pathname).toBe("/duvidas");
      expect(trocar).toHaveBeenCalledTimes(1);
      expect(empilhar).not.toHaveBeenCalled();
      empilhar.mockRestore();
      trocar.mockRestore();
    });

    it("seção saindo da faixa não muda a URL; inicio volta à raiz", () => {
      cruzar("sobre");
      vi.advanceTimersByTime(300);
      cruzar("sobre", false);
      vi.advanceTimersByTime(300);
      expect(window.location.pathname).toBe("/sobre");
      cruzar("inicio");
      vi.advanceTimersByTime(300);
      expect(window.location.pathname).toBe("/");
    });

    it("desligar desconecta o observer e cancela a troca pendente", () => {
      cruzar("sobre");
      desligar();
      vi.advanceTimersByTime(300);
      expect(desconectar).toHaveBeenCalled();
      expect(window.location.pathname).toBe("/");
      desligar = () => {};
    });

    it("sem IntersectionObserver, não faz nada", () => {
      desligar();
      vi.stubGlobal("IntersectionObserver", undefined);
      desligar = acompanharRolagem();
      expect(window.location.pathname).toBe("/");
    });
  });
});
