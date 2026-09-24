import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CidadeProvider } from "@/context/CidadeContext";
import { BotaoFlutuante } from "./BotaoFlutuante";

let callback: IntersectionObserverCallback;

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  document.body.innerHTML = '<a id="cta-hero" href="#">hero</a>';
});

afterEach(() => vi.unstubAllGlobals());

describe("BotaoFlutuante", () => {
  it("começa escondido e aparece quando o CTA do hero sai da tela", () => {
    render(
      <CidadeProvider>
        <BotaoFlutuante />
      </CidadeProvider>,
    );
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
    act(() => callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(screen.getByRole("link", { name: /whatsapp/i })).toBeInTheDocument();
  });
});
