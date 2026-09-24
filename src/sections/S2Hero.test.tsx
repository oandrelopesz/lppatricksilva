import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ASSINATURA } from "@/config";
import { TEXTOS_HERO } from "@/content/hero";
import { CidadeProvider } from "@/context/CidadeContext";
import { S2Hero } from "./S2Hero";

function renderizar() {
  return render(
    <CidadeProvider>
      <S2Hero />
    </CidadeProvider>,
  );
}

describe("S2Hero", () => {
  it("tem h1, badge de particular e assinatura completa", () => {
    renderizar();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(TEXTOS_HERO.badge)).toBeInTheDocument();
    expect(screen.getByText(ASSINATURA)).toBeInTheDocument();
    expect(ASSINATURA).toContain("MÉDICO");
  });

  it("tem o CTA do WhatsApp com id cta-hero", () => {
    renderizar();
    const cta = document.getElementById("cta-hero")!;
    expect(cta.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5513996822680/);
  });

  it("tem o link 'Veja onde ele atende' para a âncora real", () => {
    renderizar();
    expect(screen.getByRole("link", { name: /veja onde ele atende/i })).toHaveAttribute("href", "#onde-atende");
  });

  it("a foto do hero é prioritária e não é lazy", () => {
    renderizar();
    const img = screen.getByRole("img");
    expect(img).not.toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img.getAttribute("width")).toBeTruthy();
    expect(img.getAttribute("height")).toBeTruthy();
  });

  it("coloca a foto logo depois do CTA e preserva a assinatura no hero", () => {
    renderizar();
    const cta = document.getElementById("cta-hero")!;
    const foto = screen.getByRole("img", { name: TEXTOS_HERO.altFoto });
    const assinatura = screen.getByText(ASSINATURA);
    expect(cta.compareDocumentPosition(foto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(foto.compareDocumentPosition(assinatura) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
