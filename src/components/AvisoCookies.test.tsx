import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { TEXTOS_COOKIES as T } from "@/content/cookies";
import { AvisoCookies } from "./AvisoCookies";

describe("AvisoCookies", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
  });

  it("aparece quando não há escolha e some ao aceitar", () => {
    render(<AvisoCookies />);
    expect(screen.getByRole("region", { name: T.rotulo })).toHaveTextContent(T.texto);
    expect(screen.getByRole("link", { name: T.linkPolitica })).toHaveAttribute("href", "/politica-de-privacidade.html");
    fireEvent.click(screen.getByRole("button", { name: T.aceitar }));
    expect(screen.queryByRole("button", { name: T.aceitar })).toBeNull();
    expect(localStorage.getItem("lp_consentimento_v1")).toBe("aceito");
  });

  it("recusar guarda a escolha e mantém negado", () => {
    render(<AvisoCookies />);
    fireEvent.click(screen.getByRole("button", { name: T.recusar }));
    expect(localStorage.getItem("lp_consentimento_v1")).toBe("recusado");
    const ultimo = Array.from(window.dataLayer!.at(-1) as unknown as ArrayLike<unknown>);
    expect(ultimo[2]).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
  });

  it("não aparece quando já existe escolha e reabre pelo evento", () => {
    localStorage.setItem("lp_consentimento_v1", "recusado");
    render(<AvisoCookies />);
    expect(screen.queryByRole("button", { name: T.aceitar })).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("abrir-preferencias-cookies"));
    });
    expect(screen.getByRole("button", { name: T.aceitar })).toBeInTheDocument();
  });

  it("textos sem travessão", () => {
    for (const texto of Object.values(T)) expect(texto).not.toContain("—");
  });
});
