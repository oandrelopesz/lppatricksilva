import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { acompanharRolagem, iniciarNavegacaoPorSecoes, interceptarLinksDeSecao, rolarParaSecaoDaUrl } from "./navegacaoSecoes";
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

    /** Geometria simulada: só a seção posicionada cruza a faixa do meio da viewport. */
    let naFaixa: string | undefined;
    let alturaPagina = 10000;
    function posicionar(slug: string | undefined) {
      naFaixa = slug;
    }
    const cruzar = (slug: string, entrou = true) => {
      if (entrou) posicionar(slug);
      retorno!([{ target: document.getElementById(slug)!, isIntersecting: entrou } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    };

    let desligar: () => void;
    beforeEach(() => {
      observados = [];
      retorno = undefined;
      naFaixa = undefined;
      alturaPagina = 10000;
      desconectar.mockClear();
      vi.stubGlobal("IntersectionObserver", ObservadorFalso);
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        const topo = this.id && this.id === naFaixa ? 0 : 5000;
        return { top: topo, bottom: topo + 800, left: 0, right: 390, width: 390, height: 800, x: 0, y: topo, toJSON: () => ({}) } as DOMRect;
      });
      vi.spyOn(document.documentElement, "scrollHeight", "get").mockImplementation(() => alturaPagina);
      vi.useFakeTimers();
      desligar = acompanharRolagem();
    });
    afterEach(() => {
      desligar();
      vi.useRealTimers();
      vi.restoreAllMocks();
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
    });

    it("no momento de aplicar, confirma de novo a seção dominante", () => {
      cruzar("sobre");
      posicionar("onde-atende");
      vi.advanceTimersByTime(300);
      expect(window.location.pathname).toBe("/onde-atende");
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

    it("no fim da página, a última seção (agendar) é a dominante mesmo sem cruzar a faixa", () => {
      alturaPagina = window.innerHeight;
      cruzar("duvidas");
      vi.advanceTimersByTime(300);
      expect(window.location.pathname).toBe("/agendar");
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

    describe("disputa com a navegação explícita (R20, item 2)", () => {
      let desligarLinks: () => void;
      beforeEach(() => {
        desligarLinks = interceptarLinksDeSecao();
      });
      afterEach(() => desligarLinks());

      /** Simula um navegador sem o evento scrollend (o jsdom tem onscrollend). */
      function semScrollend(corpo: () => void) {
        const descritor = Object.getOwnPropertyDescriptor(window, "onscrollend");
        delete (window as { onscrollend?: unknown }).onscrollend;
        try {
          corpo();
        } finally {
          if (descritor) Object.defineProperty(window, "onscrollend", descritor);
        }
      }

      const link = (slug: string) => document.querySelector<HTMLAnchorElement>(`a[href="#${slug}"]`)!;

      it("sem scrollend: clique com o temporizador pendente cancela a troca e suspende o observador por um tempo", () => semScrollend(() => {
        expect("onscrollend" in window).toBe(false);
        cruzar("sobre");
        fireEvent.click(link("duvidas"));
        expect(window.location.pathname).toBe("/duvidas");
        vi.advanceTimersByTime(300);
        expect(window.location.pathname).toBe("/duvidas");
        cruzar("onde-atende");
        vi.advanceTimersByTime(300);
        expect(window.location.pathname).toBe("/duvidas");
        vi.advanceTimersByTime(1000);
        cruzar("onde-atende");
        vi.advanceTimersByTime(300);
        expect(window.location.pathname).toBe("/onde-atende");
      }));

      it("com scrollend: clique com o temporizador pendente espera a rolagem programada terminar", () => {
        expect("onscrollend" in window).toBe(true);
        cruzar("onde-atende");
        fireEvent.click(link("duvidas"));
        cruzar("sobre");
        vi.advanceTimersByTime(300);
        expect(window.location.pathname).toBe("/duvidas");
        window.dispatchEvent(new Event("scrollend"));
        cruzar("sobre");
        vi.advanceTimersByTime(300);
        expect(window.location.pathname).toBe("/sobre");
      });

      it("clique seguido de Voltar: o observador não sobrescreve a URL restaurada", () => {
        fireEvent.click(link("sobre"));
        expect(window.location.pathname).toBe("/sobre");
        cruzar("como-funciona");
        window.history.replaceState(null, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
        vi.advanceTimersByTime(300);
        cruzar("para-quem");
        vi.advanceTimersByTime(300);
        expect(window.location.pathname).toBe("/");
      });

      it("destino agendar (id no rodapé, fora da faixa) continua em /agendar depois da rolagem", () => {
        alturaPagina = window.innerHeight;
        fireEvent.click(link("agendar"));
        expect(window.location.pathname).toBe("/agendar");
        window.dispatchEvent(new Event("scrollend"));
        cruzar("duvidas");
        vi.advanceTimersByTime(300);
        expect(window.location.pathname).toBe("/agendar");
      });

      it("Shift, Meta e botão do meio não são interceptados", () => {
        for (const opcoes of [{ shiftKey: true }, { metaKey: true }, { button: 1 }]) {
          const seguiu = fireEvent.click(link("sobre"), opcoes);
          expect(seguiu).toBe(true);
        }
        expect(window.location.pathname).toBe("/");
        expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
      });
    });
  });

  describe("carga suspende o observador (R20, item 2)", () => {
    it("carga em /<slug> não deixa o observador trocar a URL antes de a rolagem terminar", () => {
      let retorno: IntersectionObserverCallback | undefined;
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(r: IntersectionObserverCallback) {
            retorno = r;
          }
          observe = vi.fn();
          unobserve = vi.fn();
          disconnect = vi.fn();
        },
      );
      vi.spyOn(document.documentElement, "scrollHeight", "get").mockImplementation(() => 10000);
      // O hero (inicio) cruza a faixa: sem a suspensão, a troca pendente levaria a URL para /.
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        const topo = this.id === "inicio" ? 0 : 5000;
        return { top: topo, bottom: topo + 800, left: 0, right: 390, width: 390, height: 800, x: 0, y: topo, toJSON: () => ({}) } as DOMRect;
      });
      vi.useFakeTimers();
      window.history.replaceState(null, "", "/onde-atende");
      const desligar = iniciarNavegacaoPorSecoes();
      retorno!([{ target: document.getElementById("inicio")!, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
      vi.advanceTimersByTime(300);
      expect(window.location.pathname).toBe("/onde-atende");
      desligar();
      vi.useRealTimers();
      vi.restoreAllMocks();
    });
  });
});
