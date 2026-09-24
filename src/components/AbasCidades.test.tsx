import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
