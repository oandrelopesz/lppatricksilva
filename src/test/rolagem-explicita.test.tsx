import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { TEXTOS_COMO_FUNCIONA } from "@/content/comoFunciona";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { suspenderAtualizacaoPassiva } from "@/lib/navegacaoSecoes";

vi.mock("@/lib/navegacaoSecoes", async (original) => ({
  ...(await original<typeof import("@/lib/navegacaoSecoes")>()),
  suspenderAtualizacaoPassiva: vi.fn(),
}));

/**
 * Rolagens explícitas dos componentes (mapa, rodapé, seletor) pausam a atualização passiva da URL
 * antes de rolar, do mesmo jeito que o clique em link interno (parecer R20, item 2).
 */
describe("rolagem explícita até as abas suspende o observador das seções", () => {
  let rolar: ReturnType<typeof vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>>;

  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
    rolar = vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>();
    Element.prototype.scrollIntoView = rolar;
    vi.mocked(suspenderAtualizacaoPassiva).mockClear();
  });

  afterEach(() => vi.restoreAllMocks());

  const suspendeuAntesDeRolar = () => {
    expect(suspenderAtualizacaoPassiva).toHaveBeenCalled();
    expect(rolar).toHaveBeenCalled();
    const suspensao = vi.mocked(suspenderAtualizacaoPassiva).mock.invocationCallOrder[0];
    expect(suspensao).toBeLessThan(Math.max(...rolar.mock.invocationCallOrder));
  };

  it("escolha pelo mapa", () => {
    render(<App />);
    rolar.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /Cidade de Tuntum no mapa/ }));
    expect(screen.getByRole("tab", { name: "Tuntum" })).toHaveAttribute("aria-selected", "true");
    suspendeuAntesDeRolar();
  });

  it("cidade do rodapé", () => {
    const { container } = render(<App />);
    rolar.mockClear();
    fireEvent.click(within(container.querySelector("#rodape") as HTMLElement).getByRole("link", { name: "Tuntum" }));
    suspendeuAntesDeRolar();
  });

  it("seletor, com cidade e com a opção vazia", () => {
    render(<App />);
    rolar.mockClear();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "tuntum" } });
    fireEvent.click(screen.getByRole("button", { name: TEXTOS_COMO_FUNCIONA.botaoVerLocais }));
    suspendeuAntesDeRolar();
    vi.mocked(suspenderAtualizacaoPassiva).mockClear();
    rolar.mockClear();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: TEXTOS_COMO_FUNCIONA.botaoVerLocais }));
    suspendeuAntesDeRolar();
  });
});
