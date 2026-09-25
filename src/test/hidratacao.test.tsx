import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { TEXTOS_COOKIES } from "@/content/cookies";
import { render } from "@/entry-server";

describe("hidratação do HTML pré-renderizado", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("hidrata sem erro e mostra o aviso de cookies só depois, no cliente", async () => {
    localStorage.clear();
    window.dataLayer = [];
    const erros = vi.spyOn(console, "error").mockImplementation(() => {});
    const raiz = document.createElement("div");
    raiz.innerHTML = render();
    document.body.appendChild(raiz);
    expect(raiz.textContent).not.toContain(TEXTOS_COOKIES.texto);
    expect(raiz.textContent).not.toContain(TEXTOS_COOKIES.preferencias);
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(raiz, <App />, { onRecoverableError: (e) => console.error(e) });
    });
    expect(erros).not.toHaveBeenCalled();
    expect(raiz.textContent).toContain(TEXTOS_COOKIES.texto);
    // O botão de preferências entra num efeito, depois da hidratação, sem diferença no primeiro render.
    expect(raiz.querySelector("#rodape-extra button")?.textContent).toBe(TEXTOS_COOKIES.preferencias);
    act(() => app!.unmount());
  });
});
