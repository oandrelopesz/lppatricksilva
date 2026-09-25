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

  it("mantém o texto integral rolável por teclado e a política acessível fora dele", () => {
    render(<AvisoCookies />);
    const texto = screen.getByText(T.texto);
    const politica = screen.getByRole("link", { name: T.linkPolitica });
    expect(texto).toHaveAttribute("tabindex", "0");
    expect(texto).toHaveTextContent(T.texto);
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

describe("AvisoCookies não cobre o CTA do hero (spec §5.10)", () => {
  /** Geometria simulada: CTA do hero entre topoCta e topoCta + 34; barra do aviso com alturaBarra. */
  let topoCta = 657;
  let alturaBarra = 150;
  let aoCruzar: ((visivel: boolean) => void) | undefined;
  let observados: Element[] = [];

  class ObservadorFalso {
    constructor(private retorno: IntersectionObserverCallback) {
      aoCruzar = (visivel) =>
        this.retorno([{ isIntersecting: visivel, target: observados[0] } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe = (alvo: Element) => void observados.push(alvo);
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

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
    topoCta = 657;
    alturaBarra = 150;
    aoCruzar = undefined;
    observados = [];
    vi.stubGlobal("innerHeight", 740);
    vi.stubGlobal("IntersectionObserver", ObservadorFalso);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const topo = this.id === "cta-hero" ? topoCta : 0;
      const altura = this.id === "cta-hero" ? 34 : 0;
      return { top: topo, bottom: topo + altura, left: 0, right: 360, width: 360, height: altura, x: 0, y: topo, toJSON: () => ({}) } as DOMRect;
    });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return this.getAttribute("role") === "region" ? alturaBarra : 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("a 360x740 no topo (CTA em 657..691), fica oculto até o CTA sair da tela e aparece depois da rolagem", () => {
    renderizarComHero();
    expect(screen.queryByRole("region", { name: T.rotulo })).toBeNull();
    expect(observados.map((e) => e.id)).toEqual(["cta-hero"]);
    act(() => aoCruzar!(true));
    expect(screen.queryByRole("region", { name: T.rotulo })).toBeNull();
    act(() => aoCruzar!(false));
    expect(screen.getByRole("region", { name: T.rotulo })).toBeInTheDocument();
  });

  it("sem sobreposição (CTA bem acima da barra), aparece na carga", () => {
    vi.stubGlobal("innerHeight", 900);
    topoCta = 520;
    alturaBarra = 90;
    renderizarComHero();
    expect(screen.getByRole("region", { name: T.rotulo })).toBeInTheDocument();
  });

  it("CTA só apontando na borda de baixo (1440x900: 894..928, centro fora da tela), aparece na carga", () => {
    vi.stubGlobal("innerHeight", 900);
    topoCta = 894;
    alturaBarra = 121;
    renderizarComHero();
    expect(screen.getByRole("region", { name: T.rotulo })).toBeInTheDocument();
  });

  it("carga direto numa seção (/onde-atende, CTA fora da tela), aparece na hora", () => {
    topoCta = -9000;
    renderizarComHero();
    expect(screen.getByRole("region", { name: T.rotulo })).toBeInTheDocument();
  });

  it("o botão do rodapé abre na hora, mesmo com o CTA na tela", () => {
    renderizarComHero();
    expect(screen.queryByRole("region", { name: T.rotulo })).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("abrir-preferencias-cookies"));
    });
    expect(screen.getByRole("region", { name: T.rotulo })).toBeInTheDocument();
  });

  it("enquanto mede, a barra fica invisível e fora da árvore de acessibilidade", () => {
    renderizarComHero();
    const medindo = document.querySelector('[role="region"]');
    // Depois da medição com sobreposição, a barra sai do DOM; se ainda estiver, tem de estar invisível.
    if (medindo) expect((medindo as HTMLElement).style.visibility).toBe("hidden");
  });
});
