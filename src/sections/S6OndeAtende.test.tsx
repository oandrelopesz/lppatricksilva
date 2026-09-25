import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { navegacao } from "@/components/CtaWhatsApp";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";
import { MENSAGENS_WHATSAPP } from "@/content/whatsapp";
import { CidadeProvider, useCidade } from "@/context/CidadeContext";
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

  describe("CTA de dúvida do rodapé (parecer R11)", () => {
    const irOriginal = navegacao.ir;

    beforeEach(() => {
      window.dataLayer = [];
      navegacao.ir = vi.fn();
      vi.useFakeTimers();
    });

    afterEach(() => {
      navegacao.ir = irOriginal;
      vi.useRealTimers();
    });

    function CidadeAtual() {
      const { cidade } = useCidade();
      return <output aria-label="cidade atual">{cidade?.nome ?? ""}</output>;
    }

    it("depois de abrir uma cidade e ver todas, pergunta sem a cidade e mantém a seleção", () => {
      render(
        <CidadeProvider>
          <S6OndeAtende />
          <CidadeAtual />
        </CidadeProvider>,
      );
      fireEvent.click(screen.getByRole("tab", { name: "Tuntum" }));
      fireEvent.click(screen.getByRole("button", { name: T.verTodas }));
      fireEvent.click(screen.getByRole("link", { name: T.rodapeCta }));
      vi.advanceTimersByTime(2000);
      const texto = new URL(vi.mocked(navegacao.ir).mock.calls[0][0]).searchParams.get("text")!;
      expect(texto).toBe(MENSAGENS_WHATSAPP.duvida);
      expect(texto).not.toContain("Tuntum");
      const evento = window.dataLayer!.find((e) => e.event === "clique_whatsapp")!;
      expect(evento).toMatchObject({ intencao: "duvida" });
      expect(evento).not.toHaveProperty("cidade");
      expect(screen.getByLabelText("cidade atual")).toHaveTextContent("Tuntum");
    });
  });
});
