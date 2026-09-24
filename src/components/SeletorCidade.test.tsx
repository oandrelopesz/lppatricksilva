import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEXTOS_COMO_FUNCIONA } from "@/content/comoFunciona";
import { CidadeProvider, useCidade } from "@/context/CidadeContext";
import { SeletorCidade } from "./SeletorCidade";

function MostrarCidade() {
  const { cidade, fonte } = useCidade();
  return <output>{cidade ? `${cidade.nome}:${fonte}` : "nenhuma"}</output>;
}

describe("SeletorCidade", () => {
  beforeEach(() => {
    window.dataLayer = [];
    document.body.innerHTML = '<section id="onde-atende"></section>';
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("lista as 11 cidades em 2 grupos e começa sem escolha", () => {
    render(<CidadeProvider><SeletorCidade /><MostrarCidade /></CidadeProvider>);
    expect(screen.getAllByRole("option").filter((opcao) => (opcao as HTMLOptionElement).value)).toHaveLength(11);
    expect(screen.getAllByRole("group")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("nenhuma");
  });

  it("escolhe a cidade, registra o evento e rola até os locais", () => {
    render(<CidadeProvider><SeletorCidade /><MostrarCidade /></CidadeProvider>);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "tuntum" } });
    fireEvent.click(screen.getByRole("button", { name: TEXTOS_COMO_FUNCIONA.botaoVerLocais }));
    expect(screen.getByRole("status")).toHaveTextContent("Tuntum:seletor");
    expect(window.dataLayer).toContainEqual({ event: "seletor_cidade", cidade: "Tuntum" });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
