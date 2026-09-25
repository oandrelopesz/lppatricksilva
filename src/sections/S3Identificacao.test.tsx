import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CidadeProvider } from "@/context/CidadeContext";
import { TEXTOS_IDENTIFICACAO as T } from "@/content/identificacao";
import { S3Identificacao } from "./S3Identificacao";

describe("S3Identificacao", () => {
  it("mostra três exemplos com o mesmo nível e CTA antes e depois do interativo", () => {
    render(<CidadeProvider><S3Identificacao /></CidadeProvider>);
    expect(screen.getByRole("heading", { name: T.titulo })).toBeInTheDocument();
    for (const grupo of T.grupos) {
      expect(screen.getByRole("heading", { name: grupo.rotulo, level: 3 })).toBeInTheDocument();
      for (const exemplo of grupo.exemplos) expect(screen.getByText(exemplo)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("link", { name: T.cta })).toHaveLength(2);
  });

  it("mantém três cartões equivalentes com ícone e CTA em cada lado do interativo", () => {
    const { container } = render(<CidadeProvider><S3Identificacao /></CidadeProvider>);
    const cartoes = container.querySelectorAll("#para-quem article");
    expect(cartoes).toHaveLength(3);
    for (const cartao of cartoes) {
      expect(cartao.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      expect(cartao.querySelectorAll("li")).toHaveLength(5);
    }
    const [antes, depois] = screen.getAllByRole("link", { name: T.cta });
    const interativo = container.querySelector(".autoavaliacao")!;
    expect(interativo).not.toBeNull();
    expect(antes.compareDocumentPosition(interativo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(interativo.compareDocumentPosition(depois) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("usa joelho, coluna e ombro como desenhos decorativos visíveis nos três cartões", () => {
    const { container } = render(<CidadeProvider><S3Identificacao /></CidadeProvider>);
    const cartoes = [...container.querySelectorAll("#para-quem article")];
    expect(cartoes).toHaveLength(3);
    for (const [indice, nome] of ["joelho", "coluna", "ombro"].entries()) {
      const arte = cartoes[indice].querySelector(`img[src="/prancha-${nome}.webp"]`);
      expect(arte).not.toBeNull();
      expect(arte).toHaveAttribute("alt", "");
      expect(arte).toHaveAttribute("aria-hidden", "true");
      expect(arte).toHaveAttribute("width", "400");
      expect(arte).toHaveAttribute("height", "400");
    }
  });
});
