import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CidadeProvider } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";
import { AbasCidades } from "./AbasCidades";

function renderizar() {
  return render(
    <CidadeProvider>
      <AbasCidades />
    </CidadeProvider>,
  );
}

let mostrarSecao: (() => void) | undefined;
class ObservadorFalso {
  constructor(retorno: IntersectionObserverCallback) {
    mostrarSecao = () => retorno([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe("AbasCidades", () => {
  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
    mostrarSecao = undefined;
    vi.stubGlobal("IntersectionObserver", ObservadorFalso);
  });

  it("mostra 11 abas em 2 listas por região, com Balsas aberta", () => {
    renderizar();
    expect(screen.getAllByRole("tablist")).toHaveLength(2);
    expect(screen.getAllByRole("tab")).toHaveLength(11);
    expect(screen.getAllByRole("tab").filter((aba) => aba.getAttribute("aria-selected") === "true")).toEqual([screen.getByRole("tab", { name: "Balsas" })]);
  });

  it("mostra alfinete decorativo em cada botão de cidade sem alterar o nome acessível", () => {
    renderizar();
    for (const aba of screen.getAllByRole("tab")) {
      expect(aba.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    }
    expect(screen.getByRole("tab", { name: "Balsas" })).toHaveAttribute("aria-selected", "true");
  });

  it("estado inicial: 14 endereços no HTML, Balsas visível e nenhum iframe", () => {
    const { container } = renderizar();
    expect(container.querySelectorAll(".abas-cidades__geral li")).toHaveLength(14);
    expect(screen.getAllByRole("link", { name: /como chegar/i })).toHaveLength(3);
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("clicar em Tuntum abre o painel, carrega 1 mapa sem referrer e registra o evento", () => {
    const { container } = renderizar();
    fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
    expect(screen.getByRole("tab", { name: "Tuntum" })).toHaveAttribute("aria-selected", "true");
    const painel = screen.getByRole("tabpanel", { name: "Tuntum" });
    expect(within(painel).getByText("R. dos Andrades, 58, Centro, Tuntum-MA, 65763-000")).toBeInTheDocument();
    const iframes = container.querySelectorAll("iframe");
    expect(iframes).toHaveLength(1);
    expect(iframes[0].getAttribute("src")).toContain("output=embed");
    expect(iframes[0].getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(window.dataLayer).toContainEqual({ event: "troca_aba_cidade", cidade: "Tuntum", regiao: "Centro Maranhense" });
  });

  it("Balsas mostra 3 locais com 3 mapas; trocar de aba desmonta os mapas anteriores", () => {
    const { container } = renderizar();
    fireEvent.click(screen.getByRole("tab", { name: "Balsas" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(3);
    expect(within(screen.getByRole("tabpanel", { name: "Balsas" })).getAllByRole("link", { name: /agendar em balsas/i })).toHaveLength(3);
    fireEvent.click(screen.getByRole("tab", { name: "Loreto" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("setas movem o foco sem abrir; End vai para a última da região", () => {
    renderizar();
    const balsas = screen.getByRole("tab", { name: "Balsas" });
    balsas.focus();
    fireEvent.keyDown(balsas, { key: "ArrowRight" });
    const azeitao = screen.getByRole("tab", { name: "São Domingos do Azeitão" });
    expect(azeitao).toHaveFocus();
    expect(azeitao).toHaveAttribute("aria-selected", "false");
    fireEvent.keyDown(azeitao, { key: "End" });
    expect(screen.getByRole("tab", { name: "Loreto" })).toHaveFocus();
  });

  it("aba e painel se referenciam por aria-controls e aria-labelledby", () => {
    renderizar();
    const aba = screen.getByRole("tab", { name: "Loreto" });
    fireEvent.click(aba);
    const painel = screen.getByRole("tabpanel", { name: "Loreto" });
    expect(aba.getAttribute("aria-controls")).toBe(painel.id);
    expect(painel.getAttribute("aria-labelledby")).toBe(aba.id);
  });

  it("'Como chegar' registra o evento com local e cidade", () => {
    renderizar();
    fireEvent.click(screen.getByRole("tab", { name: "Fortuna" }));
    const painel = screen.getByRole("tabpanel", { name: "Fortuna" });
    fireEvent.click(within(painel).getByRole("link", { name: /como chegar/i }));
    expect(window.dataLayer).toContainEqual({ event: "como_chegar", local: "Clínica Risalva Carvalho", cidade: "Fortuna" });
  });

  it("cidade do anúncio (?cidade=) abre o painel e espera a seção entrar na viewport", () => {
    reiniciarOrigemParaTestes();
    capturarOrigem("?cidade=loreto", null);
    const { container } = renderizar();
    expect(screen.getByRole("tab", { name: "Loreto" })).toHaveAttribute("aria-selected", "true");
    expect(container.querySelector("iframe")).toBeNull();
    act(() => mostrarSecao?.());
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("reabre a mesma cidade depois de 'Ver todas as cidades', com o mapa", () => {
    const { container } = renderizar();
    fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver todas as cidades" }));
    expect(screen.queryByRole("tabpanel")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
    expect(screen.getByRole("tabpanel", { name: "Tuntum" })).toBeVisible();
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });

  describe("roving tabindex", () => {
    const abasDoSul = () => within(screen.getByRole("tablist", { name: "Sul Maranhense" })).getAllByRole("tab");
    const focavel = () => abasDoSul().filter((aba) => aba.tabIndex === 0);

    it("sem aba selecionada, a aba focada por ArrowRight e por End fica com tabIndex 0", () => {
      renderizar();
      const balsas = screen.getByRole("tab", { name: "Balsas" });
      balsas.focus();
      fireEvent.keyDown(balsas, { key: "ArrowRight" });
      expect(focavel()).toEqual([screen.getByRole("tab", { name: "São Domingos do Azeitão" })]);
      fireEvent.keyDown(document.activeElement!, { key: "End" });
      expect(focavel()).toEqual([screen.getByRole("tab", { name: "Loreto" })]);
    });

    it("com aba selecionada, a aba focada por ArrowRight e por End fica com tabIndex 0", () => {
      renderizar();
      const balsas = screen.getByRole("tab", { name: "Balsas" });
      fireEvent.click(balsas);
      balsas.focus();
      fireEvent.keyDown(balsas, { key: "ArrowRight" });
      expect(focavel()).toEqual([screen.getByRole("tab", { name: "São Domingos do Azeitão" })]);
      expect(balsas).toHaveAttribute("aria-selected", "true");
      fireEvent.keyDown(document.activeElement!, { key: "End" });
      expect(focavel()).toEqual([screen.getByRole("tab", { name: "Loreto" })]);
      expect(balsas).toHaveAttribute("aria-selected", "true");
    });

    it("antes de o foco passar pela lista, a aba selecionada tem tabIndex 0", () => {
      renderizar();
      fireEvent.click(screen.getByRole("tab", { name: "Loreto" }));
      expect(focavel()).toEqual([screen.getByRole("tab", { name: "Loreto" })]);
    });
  });

  describe("copy aprovada (onde.*)", () => {
    it("cartão mostra o rótulo de endereço, a disponibilidade e o CTA aprovado", () => {
      renderizar();
      fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
      const painel = screen.getByRole("tabpanel", { name: "Tuntum" });
      expect(within(painel).getByText(T.clinica.enderecoRotulo)).toBeInTheDocument();
      expect(within(painel).getByText(T.clinica.disponibilidade)).toBeInTheDocument();
      expect(within(painel).getByRole("link", { name: T.clinica.ctaCurto("Tuntum") })).toBeInTheDocument();
    });

    it("cidade com mais de um local mostra o aviso de múltiplos locais; com um só, não", () => {
      renderizar();
      fireEvent.click(screen.getByRole("tab", { name: "Balsas" }));
      expect(within(screen.getByRole("tabpanel", { name: "Balsas" })).getByText(T.multiplas(3))).toBeInTheDocument();
      fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
      expect(within(screen.getByRole("tabpanel", { name: "Tuntum" })).queryByText(/locais nesta cidade/)).toBeNull();
    });
  });
});

describe("AbasCidades sem IntersectionObserver (parecer R15)", () => {
  let topoDaSecao = 5000;

  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
    vi.stubGlobal("IntersectionObserver", undefined);
    vi.useFakeTimers();
    topoDaSecao = 5000;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const topo = this.tagName === "SECTION" ? topoDaSecao : 0;
      return { top: topo, bottom: topo + 800, left: 0, right: 390, width: 390, height: 800, x: 0, y: topo, toJSON: () => ({}) } as DOMRect;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function renderizarNaSecao() {
    return render(
      <CidadeProvider>
        <section id="onde-atende">
          <AbasCidades />
        </section>
      </CidadeProvider>,
    );
  }

  it("com a seção longe, não monta mapa; ao rolar até 400 px dela, monta depois do throttle", () => {
    const { container } = renderizarNaSecao();
    expect(container.querySelector("iframe")).toBeNull();
    topoDaSecao = window.innerHeight + 300;
    fireEvent.scroll(window);
    fireEvent.scroll(window);
    expect(container.querySelector("iframe")).toBeNull();
    act(() => vi.advanceTimersByTime(250));
    expect(container.querySelectorAll("iframe")).toHaveLength(3);
  });

  it("rolar sem chegar a 400 px da seção não monta mapa", () => {
    const { container } = renderizarNaSecao();
    topoDaSecao = window.innerHeight + 600;
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(250));
    expect(container.querySelector("iframe")).toBeNull();
  });
});

describe("sombra das bordas da barra de abas (parecer R15)", () => {
  let larguraRolavel = 800;

  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    larguraRolavel = 800;
    vi.stubGlobal("IntersectionObserver", ObservadorFalso);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.getAttribute("role") === "tablist" ? larguraRolavel : 0;
    });
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.getAttribute("role") === "tablist" ? 300 : 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const listaDoSul = () => screen.getByRole("tablist", { name: "Sul Maranhense" });
  const moldura = () => listaDoSul().parentElement!;
  function rolarPara(posicao: number) {
    listaDoSul().scrollLeft = posicao;
    fireEvent.scroll(listaDoSul());
  }

  it("no início só a borda direita tem sombra; no meio, as duas; no fim, só a esquerda", () => {
    renderizar();
    expect(moldura()).toHaveAttribute("data-sombra-direita");
    expect(moldura()).not.toHaveAttribute("data-sombra-esquerda");
    rolarPara(250);
    expect(moldura()).toHaveAttribute("data-sombra-direita");
    expect(moldura()).toHaveAttribute("data-sombra-esquerda");
    rolarPara(500);
    expect(moldura()).not.toHaveAttribute("data-sombra-direita");
    expect(moldura()).toHaveAttribute("data-sombra-esquerda");
  });

  it("o foco por teclado que rola a lista atualiza a sombra", () => {
    renderizar();
    const balsas = screen.getByRole("tab", { name: "Balsas" });
    balsas.focus();
    fireEvent.keyDown(balsas, { key: "End" });
    rolarPara(500);
    expect(moldura()).not.toHaveAttribute("data-sombra-direita");
    expect(moldura()).toHaveAttribute("data-sombra-esquerda");
  });

  it("sem largura rolável, nenhuma sombra", () => {
    larguraRolavel = 300;
    renderizar();
    expect(moldura()).not.toHaveAttribute("data-sombra-direita");
    expect(moldura()).not.toHaveAttribute("data-sombra-esquerda");
  });
});
