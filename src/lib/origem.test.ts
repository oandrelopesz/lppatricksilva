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
    const o = capturarOrigem("?utm_source=google&utm_medium=cpc&utm_campaign=c01&utm_term=dor+no+joelho&gclid=Cj0abc_1", storageFalso());
    expect(o).toMatchObject({ utm_source: "google", utm_medium: "cpc", utm_campaign: "c01", gclid: "Cj0abc_1" });
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
    const primeira = capturarOrigem("?utm_source=google&utm_content=a01", storage);
    reiniciarOrigemParaTestes();
    const segunda = capturarOrigem("", storage);
    expect(segunda.ref).toBe(primeira.ref);
    expect(segunda).toMatchObject({ utm_source: "google", utm_content: "a01" });
  });

  it("uma campanha nova substitui o conjunto anterior de UTMs", () => {
    const storage = storageFalso();
    capturarOrigem("?utm_source=google&utm_content=a01", storage);
    reiniciarOrigemParaTestes();
    const nova = capturarOrigem("?utm_source=facebook", storage);
    expect(nova.utm_source).toBe("facebook");
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

  it("aplica a convenção fechada de UTMs (spec §20, R5)", () => {
    expect(sanitizar("utm_campaign", "dor_joelho")).toBeUndefined();
    expect(sanitizar("utm_content", "artrose")).toBeUndefined();
    expect(sanitizar("utm_source", "joao")).toBeUndefined();
    expect(sanitizar("utm_medium", "dor")).toBeUndefined();
    expect(sanitizar("utm_campaign", "c01")).toBe("c01");
    expect(sanitizar("utm_content", "a0412")).toBe("a0412");
    expect(sanitizar("utm_source", "facebook")).toBe("facebook");
    expect(sanitizar("utm_medium", "cpc")).toBe("cpc");
  });

  it("aceita gclid com ponto", () => {
    expect(sanitizar("gclid", "Cj0.KCQ_a-1")).toBe("Cj0.KCQ_a-1");
  });

  it("URL com UTM clínico não leva o valor para page_location", () => {
    expect(urlLimpa("https://lp-dr-santos.vercel.app/?utm_campaign=dor_joelho&utm_source=google")).toBe(
      "https://lp-dr-santos.vercel.app/?utm_source=google",
    );
  });
});
