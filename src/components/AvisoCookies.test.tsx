import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TEXTOS_COOKIES as T } from "@/content/cookies";
import { AvisoCookies } from "./AvisoCookies";

describe("AvisoCookies", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
  });

  const guardado = () => JSON.parse(localStorage.getItem("lp_consentimento_v2")!);
  const ultimoUpdate = () => Array.from(window.dataLayer!.at(-1) as unknown as ArrayLike<unknown>)[2];
  const chave = (nome: string) => screen.getByRole("switch", { name: nome }) as HTMLInputElement;

  it("primeira camada: texto, política e as três opções", () => {
    render(<AvisoCookies />);
    expect(screen.getByRole("region", { name: T.rotulo })).toHaveTextContent(T.texto);
    expect(screen.getByRole("link", { name: T.linkPolitica })).toHaveAttribute("href", "/politica-de-privacidade.html");
    for (const nome of [T.recusarTudo, T.escolher, T.aceitarTudo]) expect(screen.getByRole("button", { name: nome })).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("Aceitar tudo liga as duas categorias, sem personalização, e fecha", () => {
    render(<AvisoCookies />);
    fireEvent.click(screen.getByRole("button", { name: T.aceitarTudo }));
    expect(screen.queryByRole("region", { name: T.rotulo })).toBeNull();
    expect(guardado()).toMatchObject({ visitas: true, anuncios: true, versao: "2026-09-25" });
    expect(ultimoUpdate()).toEqual({ analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" });
  });

  it("Recusar tudo desliga as duas e mantém negado", () => {
    render(<AvisoCookies />);
    fireEvent.click(screen.getByRole("button", { name: T.recusarTudo }));
    expect(guardado()).toMatchObject({ visitas: false, anuncios: false });
    expect(ultimoUpdate()).toEqual({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  });

  it("a primeira camada tem o texto do item B, sem o trecho dos mapas (mapas sempre visíveis)", () => {
    render(<AvisoCookies />);
    expect(screen.getByRole("region", { name: T.rotulo })).toHaveTextContent(
      "Esta página usa ferramentas do Google para medir as visitas e os resultados dos anúncios. Antes de você escolher, e também se recusar, o Google recebe sinais técnicos da visita e do clique no WhatsApp, como endereço IP, navegador, horário e página, sem cookies de medição. Se aceitar, as ferramentas usam cookies nas opções que você escolher. Você pode mudar depois, no rodapé.",
    );
  });

  it("a segunda camada não fala mais de mapas nem de Ver mapa", () => {
    render(<AvisoCookies />);
    fireEvent.click(screen.getByRole("button", { name: T.escolher }));
    const regiao = screen.getByRole("region", { name: T.rotulo });
    expect(regiao.textContent).not.toMatch(/mapas|Ver mapa/);
    expect(Object.keys(T)).not.toContain("notaMapas");
  });

  it("Escolher abre a segunda camada com as duas chaves desligadas; Salvar grava só o que foi ligado", () => {
    render(<AvisoCookies />);
    fireEvent.click(screen.getByRole("button", { name: T.escolher }));
    expect(screen.getByText(T.titulo)).toBeInTheDocument();
    expect(screen.getByText(T.notaPersonalizacao)).toBeInTheDocument();
    expect(chave(T.opcaoVisitas).checked).toBe(false);
    expect(chave(T.opcaoAnuncios).checked).toBe(false);
    expect(chave(T.opcaoVisitas)).toHaveAccessibleDescription(T.opcaoVisitasDescricao);
    expect(chave(T.opcaoAnuncios)).toHaveAccessibleDescription(T.opcaoAnunciosDescricao);
    for (const nome of [T.recusarTudo, T.salvar, T.aceitarTudo]) expect(screen.getByRole("button", { name: nome })).toBeInTheDocument();
    fireEvent.click(chave(T.opcaoVisitas));
    fireEvent.click(screen.getByRole("button", { name: T.salvar }));
    expect(screen.queryByRole("region", { name: T.rotulo })).toBeNull();
    expect(guardado()).toMatchObject({ visitas: true, anuncios: false });
    expect(ultimoUpdate()).toEqual({ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  });

  it("o rodapé abre direto a segunda camada, com a escolha atual", () => {
    localStorage.setItem("lp_consentimento_v2", JSON.stringify({ visitas: false, anuncios: true, versao: "2026-09-25", data: "2026-09-25T10:00:00.000Z" }));
    render(<AvisoCookies />);
    expect(screen.queryByRole("region", { name: T.rotulo })).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("abrir-preferencias-cookies"));
    });
    expect(screen.getByText(T.titulo)).toBeInTheDocument();
    expect(chave(T.opcaoVisitas).checked).toBe(false);
    expect(chave(T.opcaoAnuncios).checked).toBe(true);
  });

  it("a escolha antiga (aceito) aparece migrada ao reabrir pelo rodapé", () => {
    localStorage.setItem("lp_consentimento_v1", "aceito");
    render(<AvisoCookies />);
    expect(screen.queryByRole("region", { name: T.rotulo })).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("abrir-preferencias-cookies"));
    });
    expect(chave(T.opcaoVisitas).checked).toBe(true);
    expect(chave(T.opcaoAnuncios).checked).toBe(true);
  });

  describe("segunda camada com altura limitada (parecer R38)", () => {
    it("título, texto e chaves ficam numa área rolável, focável e nomeada; os botões ficam fora dela", () => {
      render(<AvisoCookies />);
      fireEvent.click(screen.getByRole("button", { name: T.escolher }));
      const area = screen.getByRole("group", { name: T.titulo });
      expect(area).toHaveClass("aviso-cookies__conteudo");
      expect(area).toHaveAttribute("tabindex", "0");
      for (const s of screen.getAllByRole("switch")) expect(area.contains(s)).toBe(true);
      for (const nome of [T.recusarTudo, T.salvar, T.aceitarTudo]) expect(area.contains(screen.getByRole("button", { name: nome }))).toBe(false);
    });

    it("ao sair de Escolher, o foco vai para a área da segunda camada (o botão Escolher some)", () => {
      render(<AvisoCookies />);
      const escolher = screen.getByRole("button", { name: T.escolher });
      escolher.focus();
      fireEvent.click(escolher);
      expect(screen.getByRole("group", { name: T.titulo })).toHaveFocus();
    });

    it("a primeira camada continua sem área rolável nem tabindex", () => {
      render(<AvisoCookies />);
      expect(screen.queryByRole("group")).toBeNull();
      expect(document.querySelector(".aviso-cookies__conteudo")).not.toHaveAttribute("tabindex");
    });

    it("o CSS limita a segunda camada à viewport (dvh com fallback em vh) e rola só o conteúdo", async () => {
      const { readFileSync } = await import("node:fs");
      const css = readFileSync(`${process.cwd()}/src/styles/global.css`, "utf8").replace(/\s+/g, " ");
      const regra = css.match(/\.aviso-cookies\[data-escolhendo\] \{([^}]*)\}/)![1];
      expect(regra).toMatch(/max-height: 100vh;.*max-height: 100dvh;/);
      expect(css).toMatch(/\.aviso-cookies\[data-escolhendo\] \.aviso-cookies__conteudo \{[^}]*overflow-y: auto;/);
      expect(css).toMatch(/\.aviso-cookies\[data-escolhendo\] \.aviso-cookies__acoes \{[^}]*flex: none;/);
    });
  });

  it("revogar pelo rodapé apaga os cookies da categoria e manda o update na hora", () => {
    localStorage.setItem("lp_consentimento_v2", JSON.stringify({ visitas: true, anuncios: true, versao: "2026-09-25", data: "2026-09-25T10:00:00.000Z" }));
    document.cookie = "_ga=GA1.1.1; path=/";
    document.cookie = "_gcl_au=1.1; path=/";
    render(<AvisoCookies />);
    act(() => {
      window.dispatchEvent(new Event("abrir-preferencias-cookies"));
    });
    fireEvent.click(chave(T.opcaoVisitas));
    fireEvent.click(screen.getByRole("button", { name: T.salvar }));
    expect(ultimoUpdate()).toEqual({ analytics_storage: "denied", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" });
    expect(document.cookie).not.toContain("_ga=");
    expect(document.cookie).toContain("_gcl_au=");
    document.cookie = "_gcl_au=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("mostra o texto inteiro, sem limite de altura nem rolagem interna (parecer R32), e a política fora dele", () => {
    render(<AvisoCookies />);
    const texto = screen.getByText(T.texto);
    const politica = screen.getByRole("link", { name: T.linkPolitica });
    expect(texto.className).not.toMatch(/(^|\s)(sm:)?max-h-|overflow-y-(auto|scroll)/);
    expect(texto).not.toHaveAttribute("tabindex");
    expect(texto.contains(politica)).toBe(false);
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
    fireEvent.click(screen.getByRole("button", { name: T.recusarTudo }));
    expect(aviso()).toBeNull();
  });

  it("enquanto mede e enquanto oculta, a barra fica fora da árvore de acessibilidade", () => {
    renderizarComHero();
    const barra = document.querySelector('[role="region"]');
    if (barra) expect(barra).toHaveAttribute("aria-hidden", "true");
  });
});

describe("AvisoCookies com mudança de viewport, saída e teardown (parecer R33)", () => {
  /** Geometria simulada: viewport, CTA do hero (com a página no topo) e altura real da barra. */
  const tela = { altura: 900, topoCta: 589, alturaCta: 48, alturaBarra: 150 };
  let desconectar: ReturnType<typeof vi.fn<() => void>>;
  let entregar: ((entrada: Partial<IntersectionObserverEntry>) => void) | undefined;

  class ObservadorFalso {
    constructor(private retorno: IntersectionObserverCallback) {
      entregar = (entrada) => this.retorno([entrada as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = () => desconectar();
  }

  const aviso = () => screen.queryByRole("region", { name: T.rotulo });
  const barra = () => document.querySelector('[role="region"]');

  function mudarTela(altura: number, topoCta: number, alturaCta: number, alturaBarra: number, evento: "resize" | "orientationchange" = "resize") {
    Object.assign(tela, { altura, topoCta, alturaCta, alturaBarra });
    vi.stubGlobal("innerHeight", altura);
    act(() => {
      window.dispatchEvent(new Event(evento));
    });
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
    Object.assign(tela, { altura: 900, topoCta: 589, alturaCta: 48, alturaBarra: 150 });
    desconectar = vi.fn<() => void>();
    entregar = undefined;
    vi.stubGlobal("innerHeight", 900);
    vi.stubGlobal("scrollY", 0);
    vi.stubGlobal("IntersectionObserver", ObservadorFalso);
    // Recalcula na hora (o hook agrupa por requestAnimationFrame).
    vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => {
      f(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const topo = this.id === "cta-hero" ? tela.topoCta : 0;
      const altura = this.id === "cta-hero" ? tela.alturaCta : 0;
      return { top: topo, bottom: topo + altura, left: 0, right: 360, width: 360, height: altura, x: 0, y: topo, toJSON: () => ({}) } as DOMRect;
    });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return this.getAttribute("role") === "region" ? tela.alturaBarra : 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("desktop, depois celular, depois desktop, com o CTA na tela: aparece, oculta, aparece", () => {
    renderizarComHero();
    expect(aviso()).toBeInTheDocument(); // 1440x900: barra (750..900) não alcança o CTA (589..637)
    mudarTela(740, 623, 68, 275); // 360x740: a faixa (465..740) alcança o CTA (623..691)
    expect(aviso()).toBeNull();
    mudarTela(900, 589, 48, 150);
    expect(aviso()).toBeInTheDocument();
  });

  it("de 1440x900 para 360x740 com o CTA na tela: a barra deixa de ser interativa na hora", () => {
    renderizarComHero();
    expect(barra()).not.toHaveAttribute("inert");
    mudarTela(740, 623, 68, 275);
    expect(barra()).toHaveAttribute("inert");
    expect(barra()).toHaveAttribute("aria-hidden", "true");
    expect(barra()).toHaveAttribute("data-oculto");
  });

  it("rotação (orientationchange) com o CTA na tela recalcula a decisão", () => {
    renderizarComHero();
    mudarTela(740, 623, 68, 275, "orientationchange");
    expect(aviso()).toBeNull();
    mudarTela(360, 300, 48, 150, "orientationchange"); // paisagem baixa: faixa 210..360 alcança o CTA (300..348)
    expect(aviso()).toBeNull();
    mudarTela(900, 589, 48, 150, "orientationchange");
    expect(aviso()).toBeInTheDocument();
  });

  it("resize do visualViewport também recalcula", () => {
    const viewportVisual = new EventTarget();
    vi.stubGlobal("visualViewport", viewportVisual);
    renderizarComHero();
    expect(aviso()).toBeInTheDocument();
    Object.assign(tela, { altura: 740, topoCta: 623, alturaCta: 68, alturaBarra: 275 });
    vi.stubGlobal("innerHeight", 740);
    act(() => {
      viewportVisual.dispatchEvent(new Event("resize"));
    });
    expect(aviso()).toBeNull();
  });

  it("voltar ao hero torna a barra inerte no mesmo instante em que oculta", () => {
    mudarTela(568, 691, 68, 295);
    renderizarComHero();
    act(() => entregar!({ isIntersecting: false, boundingClientRect: { top: -108, bottom: -40 } as DOMRectReadOnly }));
    expect(aviso()).toBeInTheDocument();
    expect(barra()).not.toHaveAttribute("inert");
    act(() => entregar!({ isIntersecting: true, boundingClientRect: { top: 300, bottom: 368 } as DOMRectReadOnly }));
    expect(barra()).toHaveAttribute("inert");
    expect(barra()).toHaveAttribute("data-oculto");
  });

  it("voltar ao hero oculta já no scroll, sem esperar a entrega do observador (que vem depois da pintura)", () => {
    mudarTela(568, 691, 68, 295);
    renderizarComHero();
    act(() => entregar!({ isIntersecting: false, boundingClientRect: { top: -108, bottom: -40 } as DOMRectReadOnly }));
    expect(aviso()).toBeInTheDocument();
    Object.assign(tela, { topoCta: 250 }); // salto de volta: o CTA já está na faixa da barra (273..568)
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(barra()).toHaveAttribute("inert");
    expect(aviso()).toBeNull();
  });

  it("depois da escolha, o observador desconecta; o rodapé reabre sem religar a observação", () => {
    mudarTela(568, 691, 68, 295);
    renderizarComHero();
    act(() => entregar!({ isIntersecting: false, boundingClientRect: { top: -108, bottom: -40 } as DOMRectReadOnly }));
    desconectar.mockClear();
    fireEvent.click(screen.getByRole("button", { name: T.recusarTudo }));
    expect(desconectar).toHaveBeenCalled();
    expect(aviso()).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("abrir-preferencias-cookies"));
    });
    expect(aviso()).toBeInTheDocument();
  });

  it("sem IntersectionObserver, o listener de scroll sai depois da escolha", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const remover = vi.spyOn(window, "removeEventListener");
    mudarTela(568, 691, 68, 295);
    renderizarComHero();
    Object.assign(tela, { topoCta: -108 });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(aviso()).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: T.aceitarTudo }));
    expect(remover.mock.calls.some(([tipo]) => tipo === "scroll")).toBe(true);
  });
});
