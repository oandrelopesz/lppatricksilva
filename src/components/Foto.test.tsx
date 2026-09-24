import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Foto } from "./Foto";

describe("Foto", () => {
  it("prioriza a imagem principal e reserva suas dimensões", () => {
    render(<Foto nome="hero" alt="Retrato" sizes="100vw" prioridade />);
    const imagem = screen.getByRole("img", { name: "Retrato" });
    expect(imagem).not.toHaveAttribute("loading", "lazy");
    expect(imagem).toHaveAttribute("fetchpriority", "high");
    expect(imagem).toHaveAttribute("width", "720");
    expect(imagem).toHaveAttribute("height", "900");
  });

  it("adia as demais fotos e usa decodificação assíncrona", () => {
    render(<Foto nome="sobre" alt="Consultório" sizes="50vw" />);
    const imagem = screen.getByRole("img", { name: "Consultório" });
    expect(imagem).toHaveAttribute("loading", "lazy");
    expect(imagem).toHaveAttribute("decoding", "async");
    expect(imagem).not.toHaveAttribute("fetchpriority");
  });

  it("oferece AVIF e WebP nas quatro larguras geradas", () => {
    const { container } = render(<Foto nome="consulta" alt="Consulta" sizes="(min-width: 768px) 480px, 100vw" />);
    const fontes = container.querySelectorAll("picture > source");
    expect(fontes).toHaveLength(2);
    for (const [indice, formato] of ["avif", "webp"].entries()) {
      expect(fontes[indice]).toHaveAttribute("type", `image/${formato}`);
      expect(fontes[indice]).toHaveAttribute("sizes", "(min-width: 768px) 480px, 100vw");
      expect(fontes[indice]).toHaveAttribute(
        "srcset",
        [480, 720, 960, 1280].map((largura) => `/img/consulta-${largura}.${formato} ${largura}w`).join(", "),
      );
    }
  });
});
