import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CidadeProvider } from "@/context/CidadeContext";
import { PENDENCIAS, ASSINATURA } from "@/config";
import { TEXTOS_COMO_FUNCIONA } from "@/content/comoFunciona";
import { TEXTOS_FAQ } from "@/content/faq";
import { S4ComoFunciona } from "./S4ComoFunciona";
import { S5Sobre } from "./S5Sobre";
import { S7Faq } from "./S7Faq";
import { S8Rodape } from "./S8Rodape";

function renderizar(elemento: React.ReactNode) {
  return render(<CidadeProvider>{elemento}</CidadeProvider>);
}

describe("seções finais", () => {
  it("como funciona mostra seis passos abertos, seletor e foto real", () => {
    const { container } = renderizar(<S4ComoFunciona />);
    expect(container.querySelectorAll("#como-funciona ol > li")).toHaveLength(6);
    expect(screen.getByRole("button", { name: TEXTOS_COMO_FUNCIONA.botaoVerLocais })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: TEXTOS_COMO_FUNCIONA.altFoto })).toBeInTheDocument();
  });

  it("sobre mostra assinatura e oculta pendências sem valor", () => {
    const { container } = renderizar(<S5Sobre />);
    expect(container.querySelector("#sobre")).not.toBeNull();
    expect(screen.getByText(ASSINATURA)).toBeInTheDocument();
    expect(screen.queryByText("Graduação em Medicina:")).toBeNull();
    expect(PENDENCIAS.graduacao).toBeNull();
  });

  it("FAQ contém 11 perguntas e o CTA de dúvida", () => {
    const { container } = renderizar(<S7Faq />);
    expect(container.querySelectorAll("#duvidas [aria-expanded]")).toHaveLength(11);
    expect(screen.getByRole("link", { name: TEXTOS_FAQ.finalCta })).toBeInTheDocument();
  });

  it("rodapé contém assinatura, política, foto e slot de cookies", () => {
    const { container } = renderizar(<S8Rodape />);
    expect(container.querySelector("#rodape")).not.toBeNull();
    expect(screen.getByText(ASSINATURA)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Política de privacidade" })).toHaveAttribute("href", "/politica-de-privacidade.html");
    expect(screen.getByRole("img", { name: "Dr. Patrick Santos de pé na sala de ultrassom" })).toBeInTheDocument();
    expect(container.querySelector("#rodape-extra")).toBeEmptyDOMElement();
  });
});
