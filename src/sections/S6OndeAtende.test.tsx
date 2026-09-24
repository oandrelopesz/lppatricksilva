import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";
import { CidadeProvider } from "@/context/CidadeContext";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
import { LINK_WHATSAPP_DUVIDA } from "@/lib/whatsapp";
import { S6OndeAtende } from "./S6OndeAtende";

describe("S6OndeAtende", () => {
  beforeEach(() => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
  });

  it("usa o título e a introdução aprovados (onde.titulo, onde.intro)", () => {
    render(
      <CidadeProvider>
        <S6OndeAtende />
      </CidadeProvider>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Onde o Dr. Patrick atende" })).toBeInTheDocument();
    expect(screen.getByText(T.intro)).toBeInTheDocument();
  });

  it("rodapé da seção pergunta no WhatsApp com a mensagem de dúvida (onde.rodape, wa.duvida)", () => {
    render(
      <CidadeProvider>
        <S6OndeAtende />
      </CidadeProvider>,
    );
    expect(screen.getByText(T.rodape)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: T.rodapeCta })).toHaveAttribute("href", LINK_WHATSAPP_DUVIDA);
  });
});
