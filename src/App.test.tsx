import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TEXTOS_TOPBAR } from "@/content/topbar";
import App from "./App";

describe("App", () => {
  it("renderiza a headline e a assinatura do médico", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText(/Dr. Patrick Santos · MÉDICO · CRM-MA 16520/).length).toBeGreaterThan(0);
  });

  it("integra topbar, hero, onde atende e JSON-LD na ordem da página (parecer R9)", () => {
    const { container } = render(<App />);
    const main = container.querySelector("main#conteudo")!;
    const topbar = screen.getByText(TEXTOS_TOPBAR.aviso);
    expect(main.contains(topbar)).toBe(false);
    expect(topbar.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const h1 = screen.getByRole("heading", { level: 1 });
    const ondeAtende = main.querySelector("#onde-atende")!;
    expect(ondeAtende).not.toBeNull();
    expect(h1.compareDocumentPosition(ondeAtende) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(main.lastElementChild).toHaveAttribute("type", "application/ld+json");
  });

  it("tem as seções na ordem com as âncoras e o rodapé", () => {
    const { container } = render(<App />);
    const ids = Array.from(container.querySelectorAll("section[id]")).map((s) => s.id);
    expect(ids).toEqual(["para-quem", "como-funciona", "sobre", "onde-atende", "duvidas"]);
    const rodape = container.querySelector("#rodape");
    expect(rodape).not.toBeNull();
    expect(container.querySelector("main#conteudo")?.contains(rodape)).toBe(true);
  });
});
