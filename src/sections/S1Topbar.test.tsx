import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TEXTOS_TOPBAR } from "@/content/topbar";
import { S1Topbar } from "./S1Topbar";

describe("S1Topbar", () => {
  it("mostra o aviso de atendimento particular", () => {
    render(<S1Topbar />);
    expect(screen.getByText(TEXTOS_TOPBAR.aviso)).toBeInTheDocument();
    expect(TEXTOS_TOPBAR.aviso.toLowerCase()).toContain("particular");
  });
});
