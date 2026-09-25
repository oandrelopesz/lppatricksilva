import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TEXTOS_COOKIES as T } from "@/content/cookies";
import { AvisoCookies } from "./AvisoCookies";

describe("AvisoCookies", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
  });

  it("aparece quando não há escolha e some ao aceitar", () => {
    render(<AvisoCookies />);
    expect(screen.getByRole("region", { name: T.rotulo })).toHaveTextContent(T.texto);
    expect(screen.getByRole("link", { name: T.linkPolitica })).toHaveAttribute("href", "/politica-de-privacidade.html");
    fireEvent.click(screen.getByRole("button", { name: T.aceitar }));
    expect(screen.queryByRole("button", { name: T.aceitar })).toBeNull();
    expect(localStorage.getItem("lp_consentimento_v1")).toBe("aceito");
  });

  it("mostra o texto inteiro, sem limite de altura nem rolagem interna (parecer R32), e a política fora dele", () => {
    render(<AvisoCookies />);
    const texto = screen.getByText(T.texto);
    const politica = screen.getByRole("link", { name: T.linkPolitica });
    expect(texto).toHaveTextContent(T.texto);
    expect(texto.className).not.toMatch(/(^|\s)(sm:)?max-h-|overflow-y-(auto|scroll)/);
    expect(texto).not.toHaveAttribute("tabindex");
    // No jsdom não há layout (0 <= 0); a medida real a 320 px é feita no Chrome.
    expect(texto.scrollHeight).toBeLessThanOrEqual(texto.clientHeight);
    expect(texto.contains(politica)).toBe(false);
  });

  it("recusar guarda a escolha e mantém negado", () => {
    render(<AvisoCookies />);
    fireEvent.click(screen.getByRole("button", { name: T.recusar }));
    expect(localStorage.getItem("lp_consentimento_v1")).toBe("recusado");
    const ultimo = Array.from(window.dataLayer!.at(-1) as unknown as ArrayLike<unknown>);
    expect(ultimo[2]).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
  });

  it("não aparece quando já existe escolha e reabre pelo evento", () => {
    localStorage.setItem("lp_consentimento_v1", "recusado");
    render(<AvisoCookies />);
    expect(screen.queryByRole("button", { name: T.aceitar })).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("abrir-preferencias-cookies"));
    });
    expect(screen.getByRole("button", { name: T.aceitar })).toBeInTheDocument();
  });

  it("textos sem travessão", () => {
    for (const texto of Object.values(T)) expect(texto).not.toContain("—");
  });
});

describe("AvisoCookies não cobre o CTA do hero, de forma reativa (spec §5.10, parecer R31)", () => {
  /** Geometria simulada: CTA do hero com 68 px de altura a partir de topoCta; barra com alturaBarra. */
  let topoCta = 691;
  let alturaBarra = 337;
  let entregar: ((entrada: Partial<IntersectionObserverEntry>) => void) | undefined;

  class ObservadorFalso {
    constructor(private retorno: IntersectionObserverCallback) {
      entregar = (entrada) => this.retorno([entrada as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  /** Simula a rolagem: o CTA passa a ficar em topo..topo+68 e o observador avisa. */
  function rolarCtaPara(topo: number) {
    topoCta = topo;
    const retangulo = { top: topo, bottom: topo + 68 } as DOMRectReadOnly;
    // Sem observador (a barra não pode cobrir o CTA), a rolagem não muda nada.
    if (entregar) act(() => entregar!({ isIntersecting: topo + 68 > 0 && topo < window.innerHeight, boundingClientRect: retangulo }));
  }

  const aviso = () => screen.queryByRole("region", { name: T.rotulo });

  function renderizarComHero() {
    return render(
      <>
        <a id="cta-hero" href="https://wa.me/5513996822680">Agendar</a>
        <AvisoCookies />
      </>,
    );
  }

  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
    topoCta = 691;
    alturaBarra = 337;
    entregar = undefined;
    vi.stubGlobal("innerHeight", 568);
    vi.stubGlobal("scrollY", 0);
    vi.stubGlobal("IntersectionObserver", ObservadorFalso);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const topo = this.id === "cta-hero" ? topoCta : 0;
      const altura = this.id === "cta-hero" ? 68 : 0;
      return { top: topo, bottom: topo + altura, left: 0, right: 320, width: 320, height: altura, x: 0, y: topo, toJSON: () => ({}) } as DOMRect;
    });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return this.getAttribute("role") === "region" ? alturaBarra : 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("320x568: CTA abaixo da viewport na carga, oculto; rolando até o CTA, continua oculto; com o CTA acima, aparece", () => {
    renderizarComHero();
    expect(aviso()).toBeNull();
    rolarCtaPara(451); // rolou 240 px: o CTA estaria atrás da barra (231..568)
    expect(aviso()).toBeNull();
    rolarCtaPara(-80); // o CTA passou para cima da viewport
    expect(aviso()).toBeInTheDocument();
  });

  it("voltar ao hero sem ter escolhido oculta a barra de novo", () => {
    renderizarComHero();
    rolarCtaPara(-80);
    expect(aviso()).toBeInTheDocument();
    rolarCtaPara(300);
    expect(aviso()).toBeNull();
  });

  it("360x740 (CTA em 623..691, barra de 293 px): oculto na carga", () => {
    vi.stubGlobal("innerHeight", 740);
    topoCta = 623;
    alturaBarra = 293;
    renderizarComHero();
    expect(aviso()).toBeNull();
  });

  it("desktop em que a barra não alcança o CTA (CTA em 600..668, barra de 121 px a 900): aparece na carga e fica", () => {
    vi.stubGlobal("innerHeight", 900);
    topoCta = 600;
    alturaBarra = 121;
    renderizarComHero();
    expect(aviso()).toBeInTheDocument();
    rolarCtaPara(300);
    expect(aviso()).toBeInTheDocument();
  });

  it("carga direta em /onde-atende (CTA acima da viewport): aparece na hora", () => {
    vi.stubGlobal("scrollY", 10000);
    topoCta = -9300;
    renderizarComHero();
    expect(aviso()).toBeInTheDocument();
  });

  it("o botão do rodapé abre na hora, em cima do hero, e mantém até a escolha", () => {
    renderizarComHero();
    expect(aviso()).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("abrir-preferencias-cookies"));
    });
    expect(aviso()).toBeInTheDocument();
    rolarCtaPara(300);
    expect(aviso()).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: T.recusar }));
    expect(aviso()).toBeNull();
  });

  it("enquanto mede e enquanto oculta, a barra fica fora da árvore de acessibilidade", () => {
    renderizarComHero();
    const barra = document.querySelector('[role="region"]');
    if (barra) expect(barra).toHaveAttribute("aria-hidden", "true");
  });
});
