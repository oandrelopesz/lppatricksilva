import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CidadeProvider } from "@/context/CidadeContext";
import { PENDENCIAS, ASSINATURA } from "@/config";
import { TEXTOS_COMO_FUNCIONA } from "@/content/comoFunciona";
import { TEXTOS_FAQ } from "@/content/faq";
import { TEXTOS_COOKIES } from "@/content/cookies";
import { TEXTOS_RODAPE } from "@/content/rodape";
import { TEXTOS_SOBRE } from "@/content/sobre";
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

  it("organiza os seis passos numa linha do tempo e integra o seletor ao primeiro", () => {
    const { container } = renderizar(<S4ComoFunciona />);
    const passos = container.querySelectorAll("#como-funciona ol > li");
    expect(passos).toHaveLength(6);
    expect(container.querySelectorAll("#como-funciona .timeline-marker")).toHaveLength(6);
    for (const passo of passos) expect(passo.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(passos[0].querySelector("#seletor-cidade")).not.toBeNull();
    expect(container.querySelector("#como-funciona img")).toHaveClass("premium-photo");
  });

  it("passo 3 fala só da leitura dos exames levados, sem lista do que levar (spec §17.13, parecer R13)", () => {
    renderizar(<S4ComoFunciona />);
    const passo3 = TEXTOS_COMO_FUNCIONA.passos[2].texto;
    expect(passo3).toContain("leitura dos exames que você levar");
    expect(document.body.textContent).not.toMatch(/Raio X|ressonância|leve junto/i);
  });

  it("sobre mostra assinatura e oculta pendências sem valor", () => {
    const { container } = renderizar(<S5Sobre />);
    expect(container.querySelector("#sobre")).not.toBeNull();
    expect(screen.getByText(ASSINATURA)).toBeInTheDocument();
    expect(screen.queryByText("Graduação em Medicina:")).toBeNull();
    expect(PENDENCIAS.graduacao).toBeNull();
    expect(screen.getByRole("img", { name: "Dr. Patrick Santos de pé ao lado do aparelho de ultrassom na sala de consulta" })).toBeInTheDocument();
    expect(container.querySelectorAll("#sobre .sobre-fatos li")).toHaveLength(3);
    for (const texto of TEXTOS_SOBRE.paragrafos) expect(screen.getByText(texto)).toBeInTheDocument();
    expect(container.querySelector('#sobre img[src^="/ilustracao-"]')).toBeNull();
  });

  it("FAQ contém 11 perguntas e o CTA de dúvida", () => {
    const { container } = renderizar(<S7Faq />);
    expect(container.querySelectorAll("#duvidas [aria-expanded]")).toHaveLength(11);
    expect(screen.getByRole("link", { name: TEXTOS_FAQ.finalCta })).toBeInTheDocument();
    expect(container.querySelectorAll('#duvidas button[aria-expanded] svg[aria-hidden="true"]')).toHaveLength(11);
    expect(container.querySelector("#duvidas .faq-fecho")).not.toBeNull();
  });

  it("rodapé contém assinatura, política, foto e slot de cookies", () => {
    const { container } = renderizar(<S8Rodape />);
    expect(container.querySelector("#rodape")).not.toBeNull();
    expect(screen.getByText(ASSINATURA)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Política de privacidade" })).toHaveAttribute("href", "/politica-de-privacidade.html");
    expect(screen.getByRole("img", { name: "Dr. Patrick Santos sentado ao lado do aparelho de ultrassom, sorrindo" })).toBeInTheDocument();
    expect(container.querySelector("#rodape .rodape-fecho img")).not.toBeNull();
    expect(container.querySelectorAll('#rodape .rodape-cidades a[href^="#aba-"]')).toHaveLength(11);
    const botao = screen.getByRole("button", { name: TEXTOS_COOKIES.preferencias });
    expect(container.querySelector("#rodape-extra")!.contains(botao)).toBe(true);
    const reabrir = vi.fn();
    window.addEventListener("abrir-preferencias-cookies", reabrir);
    fireEvent.click(botao);
    window.removeEventListener("abrir-preferencias-cookies", reabrir);
    expect(reabrir).toHaveBeenCalledTimes(1);
  });

  it("rodapé tem Política de privacidade e Termos de uso lado a lado, com alvo de 48 px, e mantém o texto LGPD e o botão de cookies", () => {
    const { container } = renderizar(<S8Rodape />);
    const politica = screen.getByRole("link", { name: "Política de privacidade" });
    const termos = screen.getByRole("link", { name: TEXTOS_RODAPE.termosLink });
    expect(TEXTOS_RODAPE.termosLink).toBe("Termos de uso");
    expect(termos).toHaveAttribute("href", "/termos-de-uso.html");
    const grupo = container.querySelector(".rodape-legal")!;
    expect(grupo.contains(politica) && grupo.contains(termos)).toBe(true);
    expect(grupo).toHaveClass("flex", "flex-wrap");
    for (const link of [politica, termos]) expect(link).toHaveClass("min-h-12");
    expect(screen.getByText(TEXTOS_RODAPE.lgpd)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: TEXTOS_COOKIES.preferencias })).toBeInTheDocument();
  });
});
