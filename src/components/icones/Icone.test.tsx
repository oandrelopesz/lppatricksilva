import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icone } from "./Icone";

describe("Icone", () => {
  it("oculta o ícone decorativo da árvore de acessibilidade", () => {
    const { container } = render(<Icone nome="joelho" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("dá nome acessível ao ícone informativo", () => {
    render(<Icone nome="ultrassom" titulo="Ultrassom" />);
    expect(screen.getByRole("img", { name: "Ultrassom" })).toBeInTheDocument();
  });
});
