import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CidadeProvider } from "@/context/CidadeContext";
import { useCidade } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { CIDADES } from "@/data/locais";
import { PONTOS_CIDADES } from "@/data/mapaMaranhao";
import { AbasCidades } from "./AbasCidades";

let acionarIntersecao: ((visivel: boolean) => void) | undefined;
let margemObservada: string | undefined;
const desconectar = vi.fn();

class ObservadorFalso {
  constructor(private retorno: IntersectionObserverCallback, public opcoes?: IntersectionObserverInit) {
    margemObservada = opcoes?.rootMargin;
    acionarIntersecao = (visivel) =>
      this.retorno([{ isIntersecting: visivel } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = desconectar;
}

function renderizar() {
  function EstadoCidade() {
    const { cidade } = useCidade();
    return <output data-testid="cidade-contexto">{cidade?.nome ?? "nenhuma"}</output>;
  }
  return render(<CidadeProvider><EstadoCidade /><AbasCidades /></CidadeProvider>);
}

describe("mapas e mapa ilustrado V3", () => {
  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
    acionarIntersecao = undefined;
    desconectar.mockClear();
    vi.stubGlobal("IntersectionObserver", ObservadorFalso);
  });

  it("abre Balsas só visualmente e espera a seção chegar a 400 px", () => {
    const { container } = renderizar();
    expect(screen.getByRole("tab", { name: "Balsas" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("cidade-contexto")).toHaveTextContent("nenhuma");
    expect(margemObservada).toBe("400px 0px");
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.queryByRole("button", { name: "Ver mapa" })).toBeNull();
    expect(container.querySelector(".abas-cidades__lista")).not.toBeNull();
    act(() => acionarIntersecao?.(true));
    const iframes = container.querySelectorAll("iframe");
    expect(iframes).toHaveLength(3);
    expect(iframes[0]).toHaveAttribute("loading", "lazy");
    expect(iframes[0]).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(iframes[0]).toHaveAttribute("height", "240");
    expect(iframes[0].parentElement).toHaveClass("cartao-local__mapa");
    expect(desconectar).toHaveBeenCalled();
  });

  it("troca de aba desmonta os mapas anteriores e carrega os novos direto", () => {
    const { container } = renderizar();
    act(() => acionarIntersecao?.(true));
    expect(container.querySelectorAll("iframe")).toHaveLength(3);
    fireEvent.click(screen.getByRole("tab", { name: "Loreto" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(within(screen.getByRole("tabpanel", { name: "Loreto" })).getByRole("link", { name: /agendar em loreto/i })).toBeInTheDocument();
  });

  it("separa as áreas de toque dos pontos no quadro compacto e no desktop", () => {
    renderizar();
    const botoes = screen.getAllByRole("button", { name: /no mapa/ });
    for (const [sufixo, largura, altura] of [["compacto", 246, 287], ["amplo", 600, 700]] as const) {
      const pontos = botoes.map((botao) => ({
        x: parseFloat(botao.style.getPropertyValue(`--x-${sufixo}`)) * largura / 100,
        y: parseFloat(botao.style.getPropertyValue(`--y-${sufixo}`)) * altura / 100,
      }));
      for (const ponto of pontos) {
        expect(Number.isFinite(ponto.x) && Number.isFinite(ponto.y)).toBe(true);
        expect(ponto.x).toBeGreaterThanOrEqual(24);
        expect(ponto.x).toBeLessThanOrEqual(largura - 24);
      }
      for (let i = 0; i < pontos.length; i++) {
        for (let j = i + 1; j < pontos.length; j++) {
          const dx = Math.max(Math.abs(pontos[i].x - pontos[j].x) - 48, 0);
          const dy = Math.max(Math.abs(pontos[i].y - pontos[j].y) - 48, 0);
          expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(7.9);
        }
      }
    }
  });

  it("liga cada chamada deslocada ao centroide real sem cruzar as outras", () => {
    const { container } = renderizar();
    const botoes = screen.getAllByRole("button", { name: /no mapa/ });
    const segmentos = CIDADES.map((cidade, indice) => {
      const botao = botoes[indice];
      const fim = PONTOS_CIDADES[cidade.id];
      const inicio = {
        x: parseFloat(botao.style.getPropertyValue("--x-compacto")) * 6,
        y: parseFloat(botao.style.getPropertyValue("--y-compacto")) * 7,
      };
      const guia = container.querySelector<SVGPathElement>(`.mapa-ma__guia--compacta[data-cidade="${cidade.id}"]`);
      if (Math.hypot(inicio.x - fim.x, inicio.y - fim.y) > 6) {
        expect(guia).not.toBeNull();
        const coordenadas = guia?.getAttribute("d")?.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
        expect(coordenadas).toHaveLength(4);
        expect(coordenadas?.[0]).toBeCloseTo(inicio.x);
        expect(coordenadas?.[1]).toBeCloseTo(inicio.y);
        expect(coordenadas?.[2]).toBeCloseTo(fim.x);
        expect(coordenadas?.[3]).toBeCloseTo(fim.y);
        expect(guia).not.toHaveAttribute("hidden");
      }
      expect(container.querySelector(`.mapa-ma__centroide[data-cidade="${cidade.id}"]`)).not.toBeNull();
      return { inicio, fim };
    });
    const lado = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) =>
      (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    for (let i = 0; i < segmentos.length; i++) for (let j = i + 1; j < segmentos.length; j++) {
      const a = segmentos[i], b = segmentos[j];
      const cruza = lado(a.inicio, a.fim, b.inicio) * lado(a.inicio, a.fim, b.fim) < 0 &&
        lado(b.inicio, b.fim, a.inicio) * lado(b.inicio, b.fim, a.fim) < 0;
      expect(cruza, `${CIDADES[i].nome} / ${CIDADES[j].nome}`).toBe(false);
    }
    expect(container.querySelector('.mapa-ma__guia--compacta[data-cidade="balsas"]')).toHaveAttribute("data-ativa");
    expect(container.querySelector('.mapa-ma__centroide[data-cidade="balsas"]')).toHaveAttribute("data-ativa");
  });

  it("toque na posição real da cidade escolhe sua aba", () => {
    renderizar();
    const quadro = screen.getByRole("group", { name: /cidades no mapa ilustrado/i });
    vi.spyOn(quadro, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, right: 246, bottom: 287, width: 246, height: 287,
      x: 0, y: 0, toJSON: () => ({}),
    });
    for (const botao of screen.getAllByRole("button", { name: /no mapa/ })) {
      vi.spyOn(botao, "getBoundingClientRect").mockReturnValue({
        left: 1000, top: 1000, right: 1048, bottom: 1048, width: 48, height: 48,
        x: 1000, y: 1000, toJSON: () => ({}),
      });
    }
    const real = PONTOS_CIDADES["graca-aranha"];
    fireEvent.click(quadro, { clientX: real.x * 246 / 600, clientY: real.y * 287 / 700 });
    expect(screen.getByRole("tab", { name: "Graça Aranha" })).toHaveAttribute("aria-selected", "true");
  });

  it("toque perto de um ponto escolhe a cidade; longe de todos não escolhe", () => {
    const { container } = renderizar();
    const quadro = screen.getByRole("group", { name: /cidades no mapa ilustrado/i });
    const tuntum = screen.getByRole("button", { name: /^\d+, Cidade de Tuntum no mapa$/ });
    for (const botao of screen.getAllByRole("button", { name: /no mapa/ })) {
      vi.spyOn(botao, "getBoundingClientRect").mockReturnValue({
        left: botao === tuntum ? 100 : 1000, top: botao === tuntum ? 100 : 1000,
        right: botao === tuntum ? 148 : 1048, bottom: botao === tuntum ? 148 : 1048,
        width: 48, height: 48, x: 0, y: 0, toJSON: () => ({}),
      });
    }
    fireEvent.click(quadro, { clientX: 0, clientY: 0 });
    expect(screen.getByTestId("cidade-contexto")).toHaveTextContent("nenhuma");
    fireEvent.click(quadro, { clientX: 130, clientY: 130 });
    expect(screen.getByTestId("cidade-contexto")).toHaveTextContent("Tuntum");
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("mantém os pontos operáveis por teclado e leva o foco à aba escolhida", async () => {
    const usuario = userEvent.setup();
    renderizar();
    const ponto = screen.getByRole("button", { name: /^\d+, Cidade de Tuntum no mapa$/ });
    const aba = screen.getByRole("tab", { name: "Tuntum" });
    aba.scrollIntoView = vi.fn();
    ponto.focus();
    await usuario.keyboard("{Enter}");
    expect(aba).toHaveFocus();
    expect(aba.scrollIntoView).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ behavior: "smooth", block: "start" }));
  });

  it("rola instantaneamente para a aba com movimento reduzido", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    renderizar();
    const aba = screen.getByRole("tab", { name: "Tuntum" });
    aba.scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: /^\d+, Cidade de Tuntum no mapa$/ }));
    expect(aba.scrollIntoView).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ behavior: "auto", block: "start" }));
    expect(aba).toHaveFocus();
    vi.unstubAllGlobals();
  });

  it("ponto do mapa abre a aba e registra a mesma fonte aba", () => {
    const { container } = renderizar();
    fireEvent.click(screen.getByRole("button", { name: /^\d+, Cidade de Tuntum no mapa$/ }));
    expect(screen.getByTestId("cidade-contexto")).toHaveTextContent("Tuntum");
    expect(screen.getByRole("tab", { name: "Tuntum" })).toHaveAttribute("aria-selected", "true");
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(window.dataLayer).toContainEqual({ event: "troca_aba_cidade", cidade: "Tuntum", regiao: "Centro Maranhense" });
    expect(screen.getAllByRole("button", { name: /no mapa/ })).toHaveLength(11);
  });

  it("começa o nome acessível de cada ponto pelo número visível", () => {
    renderizar();
    for (const ponto of screen.getAllByRole("button", { name: /no mapa/ })) {
      expect(ponto).toHaveAccessibleName(new RegExp(`^${ponto.querySelector('.mapa-ma__numero')?.textContent}, Cidade de `));
    }
  });

  it("cidade válida da URL abre a aba certa sem mapa até a interseção", () => {
    reiniciarOrigemParaTestes();
    capturarOrigem("?cidade=loreto", null);
    const { container } = renderizar();
    expect(screen.getByRole("tab", { name: "Loreto" })).toHaveAttribute("aria-selected", "true");
    expect(container.querySelector("iframe")).toBeNull();
    act(() => acionarIntersecao?.(true));
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });
});
