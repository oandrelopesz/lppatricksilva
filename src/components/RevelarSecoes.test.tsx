import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RevelarSecoes } from "./RevelarSecoes";

let observar: IntersectionObserverCallback;
const observarElemento = vi.fn();
const desconectar = vi.fn();

class ObservadorFalso {
  constructor(callback: IntersectionObserverCallback) { observar = callback; }
  observe = observarElemento;
  unobserve = vi.fn();
  disconnect = desconectar;
}

describe("RevelarSecoes", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("só anima seções abaixo da dobra e as revela ao entrar na viewport", () => {
    vi.stubGlobal("IntersectionObserver", ObservadorFalso);
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return { top: this.id === "para-quem" ? 100 : 1200 } as DOMRect;
    });
    const { container } = render(<main><section id="para-quem" /><section id="sobre" /><RevelarSecoes /></main>);
    const perto = container.querySelector("#para-quem")!;
    const longe = container.querySelector("#sobre")!;
    expect(perto).not.toHaveClass("revelar-pendente");
    expect(longe).toHaveClass("revelar-pendente");
    expect(observarElemento).toHaveBeenCalledWith(longe);
    act(() => observar([{ target: longe, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(longe).not.toHaveClass("revelar-pendente");
  });

  it("deixa tudo visível se a pessoa prefere movimento reduzido", () => {
    vi.stubGlobal("IntersectionObserver", ObservadorFalso);
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ top: 1200 } as DOMRect);
    const { container } = render(<main><section id="sobre" /><RevelarSecoes /></main>);
    expect(container.querySelector("#sobre")).not.toHaveClass("revelar-pendente");
  });
});
