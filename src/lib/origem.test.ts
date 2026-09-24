import { beforeEach, describe, expect, it } from "vitest";
import { capturarOrigem, gerarRef, reiniciarOrigemParaTestes, sanitizar, urlLimpa } from "./origem";

function storageFalso(): Storage {
  const mapa = new Map<string, string>();
  return {
    getItem: (k: string) => mapa.get(k) ?? null,
    setItem: (k: string, v: string) => void mapa.set(k, v),
    removeItem: (k: string) => void mapa.delete(k),
    clear: () => mapa.clear(),
    key: () => null,
    get length() {
      return mapa.size;
    },
  } as Storage;
}

describe("origem", () => {
  beforeEach(() => reiniciarOrigemParaTestes());

  it("gera ref de 6 caracteres sem caracteres ambíguos", () => {
    expect(gerarRef()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  it("captura UTMs permitidos e gclid, e nunca utm_term", () => {
    const o = capturarOrigem("?utm_source=google&utm_medium=cpc&utm_campaign=g1_dor&utm_term=dor+no+joelho&gclid=Cj0abc_1", storageFalso());
    expect(o).toMatchObject({ utm_source: "google", utm_medium: "cpc", utm_campaign: "g1_dor", gclid: "Cj0abc_1" });
    expect(o).not.toHaveProperty("utm_term");
  });

  it("descarta valores com espaço, acento, @ ou longos demais", () => {
    expect(sanitizar("utm_campaign", "dor no joelho")).toBeUndefined();
    expect(sanitizar("utm_content", "maria@email.com")).toBeUndefined();
    expect(sanitizar("utm_source", "joão")).toBeUndefined();
    expect(sanitizar("utm_source", "a".repeat(101))).toBeUndefined();
    expect(sanitizar("utm_source", "google")).toBe("google");
  });

  it("mantém ref e UTMs da sessão quando a URL vem sem parâmetros", () => {
    const storage = storageFalso();
    const primeira = capturarOrigem("?utm_source=google&utm_content=a1", storage);
    reiniciarOrigemParaTestes();
    const segunda = capturarOrigem("", storage);
    expect(segunda.ref).toBe(primeira.ref);
    expect(segunda).toMatchObject({ utm_source: "google", utm_content: "a1" });
  });

  it("uma campanha nova substitui o conjunto anterior de UTMs", () => {
    const storage = storageFalso();
    capturarOrigem("?utm_source=google&utm_content=a1", storage);
    reiniciarOrigemParaTestes();
    const nova = capturarOrigem("?utm_source=meta", storage);
    expect(nova.utm_source).toBe("meta");
    expect(nova.utm_content).toBeUndefined();
  });

  it("a cidade vale só para a navegação atual", () => {
    const storage = storageFalso();
    expect(capturarOrigem("?cidade=loreto", storage).cidade).toBe("loreto");
    reiniciarOrigemParaTestes();
    expect(capturarOrigem("", storage).cidade).toBeUndefined();
    reiniciarOrigemParaTestes();
    expect(capturarOrigem("?cidade=recife", storage).cidade).toBeUndefined();
  });

  it("funciona com storage que lança erro", () => {
    const quebrado = {
      getItem() {
        throw new Error("bloqueado");
      },
      setItem() {
        throw new Error("bloqueado");
      },
    } as unknown as Storage;
    expect(capturarOrigem("?utm_source=google", quebrado).utm_source).toBe("google");
  });

  it("urlLimpa mantém só parâmetros permitidos e válidos", () => {
    const limpa = urlLimpa("https://lp-dr-santos.vercel.app/?utm_source=google&utm_term=dor+no+joelho&nome=Maria&cidade=tuntum#duvidas");
    expect(limpa).toBe("https://lp-dr-santos.vercel.app/?utm_source=google&cidade=tuntum");
  });
});
