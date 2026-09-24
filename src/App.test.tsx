import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TEXTOS_COMO_FUNCIONA } from "@/content/comoFunciona";
import { TEXTOS_ONDE_ATENDE } from "@/content/ondeAtende";
import { TEXTOS_TOPBAR } from "@/content/topbar";
import { capturarOrigem, reiniciarOrigemParaTestes } from "@/lib/origem";
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

  it("cidade do rodapé abre a aba, leva o foco e libera o mapa (parecer R13)", () => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
    const { container } = render(<App />);
    const rodape = container.querySelector("#rodape") as HTMLElement;
    const link = within(rodape).getByRole("link", { name: "Tuntum" });
    expect(link).toHaveAttribute("href", "#aba-tuntum");
    fireEvent.click(link);
    const aba = screen.getByRole("tab", { name: "Tuntum" });
    expect(aba).toHaveAttribute("aria-selected", "true");
    expect(aba).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Tuntum" })).toBeVisible();
    expect(container.querySelectorAll("#onde-atende iframe")).toHaveLength(1);
    expect(window.dataLayer).toContainEqual({ event: "troca_aba_cidade", cidade: "Tuntum", regiao: "Centro Maranhense" });
  });

  it("cidade do rodapé com Ctrl segue o link sem abrir a aba na página (parecer R13b)", () => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    window.dataLayer = [];
    const { container } = render(<App />);
    const rodape = container.querySelector("#rodape") as HTMLElement;
    const link = within(rodape).getByRole("link", { name: "Tuntum" });
    const naoCancelado = fireEvent.click(link, { ctrlKey: true });
    expect(naoCancelado).toBe(true);
    expect(screen.getByRole("tab", { name: "Tuntum" })).toHaveAttribute("aria-selected", "false");
    expect(container.querySelector("#painel-tuntum iframe")).toBeNull();
    expect(window.dataLayer).not.toContainEqual(expect.objectContaining({ event: "troca_aba_cidade" }));
  });

  it("seletor reaplica a mesma cidade depois de 'Ver todas as cidades' e reabre a aba (parecer R15)", () => {
    reiniciarOrigemParaTestes();
    capturarOrigem("", null);
    Element.prototype.scrollIntoView = vi.fn();
    render(<App />);
    const botaoVerLocais = screen.getByRole("button", { name: TEXTOS_COMO_FUNCIONA.botaoVerLocais });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "tuntum" } });
    fireEvent.click(botaoVerLocais);
    expect(screen.getByRole("tabpanel", { name: "Tuntum" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: TEXTOS_ONDE_ATENDE.verTodas }));
    expect(screen.queryByRole("tabpanel")).toBeNull();
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("tuntum");
    fireEvent.click(botaoVerLocais);
    expect(screen.getByRole("tabpanel", { name: "Tuntum" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Tuntum" })).toHaveAttribute("aria-selected", "true");
  });
});
