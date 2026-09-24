import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Accordion } from "./Accordion";

const ITENS = [
  { id: "cirurgia", pergunta: "Vou precisar operar?", resposta: "Resposta A" },
  { id: "valor", pergunta: "Qual o valor da consulta?", resposta: "Resposta B" },
];

describe("Accordion", () => {
  beforeEach(() => { window.dataLayer = []; });

  it("começa fechado com o conteúdo no HTML", () => {
    render(<Accordion itens={ITENS} />);
    expect(screen.getByRole("button", { name: "Vou precisar operar?" })).toHaveAttribute("aria-expanded", "false");
    expect(document.body.textContent).toContain("Resposta A");
  });

  it("abre a pergunta, expõe a região e registra o evento", () => {
    render(<Accordion itens={ITENS} />);
    const botao = screen.getByRole("button", { name: "Vou precisar operar?" });
    fireEvent.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Vou precisar operar?" })).toHaveTextContent("Resposta A");
    expect(window.dataLayer).toContainEqual({ event: "faq_aberta", pergunta: "cirurgia" });
  });
});
