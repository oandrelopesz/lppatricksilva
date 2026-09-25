import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SECOES, atualizarUrl, caminhoDaSecao, irParaSecao, secaoDaUrl } from "./secoes";

function preferirMenosMovimento(valor: boolean) {
  vi.stubGlobal("matchMedia", (consulta: string) => ({ matches: valor && consulta.includes("reduce") }));
}

describe("secoes", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    document.body.innerHTML = SECOES.map((slug) => `<section id="${slug}"></section>`).join("");
    Element.prototype.scrollIntoView = vi.fn();
    preferirMenosMovimento(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("lista as sete seções na ordem da página", () => {
    expect(SECOES).toEqual(["inicio", "para-quem", "como-funciona", "sobre", "onde-atende", "duvidas", "agendar"]);
  });

  it("secaoDaUrl reconhece /<slug> com ou sem barra final e ignora o resto", () => {
    expect(secaoDaUrl("/onde-atende")).toBe("onde-atende");
    expect(secaoDaUrl("/onde-atende/")).toBe("onde-atende");
    expect(secaoDaUrl("/inicio")).toBe("inicio");
    expect(secaoDaUrl("/")).toBeUndefined();
    expect(secaoDaUrl("/politica-de-privacidade.html")).toBeUndefined();
    expect(secaoDaUrl("/onde-atende/tuntum")).toBeUndefined();
  });

  it("caminhoDaSecao usa a raiz para inicio", () => {
    expect(caminhoDaSecao("inicio")).toBe("/");
    expect(caminhoDaSecao("duvidas")).toBe("/duvidas");
  });

  it("irParaSecao rola sem animação por padrão e suave quando pedido", () => {
    const alvo = document.getElementById("sobre")!;
    expect(irParaSecao("sobre")).toBe(true);
    expect(alvo.scrollIntoView).toHaveBeenLastCalledWith({ behavior: "instant", block: "start" });
    irParaSecao("sobre", { suave: true });
    expect(alvo.scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth", block: "start" });
  });

  it("irParaSecao não anima com prefers-reduced-motion", () => {
    preferirMenosMovimento(true);
    irParaSecao("sobre", { suave: true });
    expect(document.getElementById("sobre")!.scrollIntoView).toHaveBeenLastCalledWith({ behavior: "instant", block: "start" });
  });

  it("irParaSecao devolve false quando a seção não existe", () => {
    document.body.innerHTML = "";
    expect(irParaSecao("agendar")).toBe(false);
  });

  it("atualizarUrl empilha /<slug>, usa a raiz para inicio e mantém a query", () => {
    window.history.replaceState(null, "", "/?utm_source=google&utm_campaign=c01");
    const empilhar = vi.spyOn(window.history, "pushState");
    atualizarUrl("onde-atende");
    expect(window.location.pathname).toBe("/onde-atende");
    expect(window.location.search).toBe("?utm_source=google&utm_campaign=c01");
    atualizarUrl("inicio");
    expect(window.location.pathname).toBe("/");
    expect(empilhar).toHaveBeenCalledTimes(2);
    empilhar.mockRestore();
  });

  it("atualizarUrl com replace não empilha e não repete a URL atual", () => {
    const empilhar = vi.spyOn(window.history, "pushState");
    const trocar = vi.spyOn(window.history, "replaceState");
    atualizarUrl("sobre", { substituir: true });
    expect(window.location.pathname).toBe("/sobre");
    atualizarUrl("sobre", { substituir: true });
    expect(trocar).toHaveBeenCalledTimes(1);
    expect(empilhar).not.toHaveBeenCalled();
    empilhar.mockRestore();
    trocar.mockRestore();
  });
});
