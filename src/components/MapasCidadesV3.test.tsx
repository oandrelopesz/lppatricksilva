import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CidadeProvider } from "@/context/CidadeContext";
import { useCidade } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
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

  it("ponto do mapa abre a aba e registra a mesma fonte aba", () => {
    const { container } = renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Cidade de Tuntum no mapa" }));
    expect(screen.getByTestId("cidade-contexto")).toHaveTextContent("Tuntum");
    expect(screen.getByRole("tab", { name: "Tuntum" })).toHaveAttribute("aria-selected", "true");
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(window.dataLayer).toContainEqual({ event: "troca_aba_cidade", cidade: "Tuntum", regiao: "Centro Maranhense" });
    expect(screen.getAllByRole("button", { name: /no mapa/ })).toHaveLength(11);
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
