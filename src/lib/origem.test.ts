import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { capturarOrigem, limparEndereco, reiniciarOrigemParaTestes, sanitizar, urlLimpa } from "./origem";

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

  it("a origem não tem código de referência (spec §21, sem ref)", () => {
    expect(capturarOrigem("?utm_source=google", storageFalso())).not.toHaveProperty("ref");
  });

  it("sessão antiga gravada com ref continua funcionando e ignora o campo", () => {
    const storage = storageFalso();
    storage.setItem("lp_origem_v1", JSON.stringify({ ref: "ABC234", utm_source: "google", utm_content: "a01" }));
    const origem = capturarOrigem("", storage);
    expect(origem).toMatchObject({ utm_source: "google", utm_content: "a01" });
    expect(origem).not.toHaveProperty("ref");
    expect(storage.getItem("lp_origem_v1")).not.toContain("ref");
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

  it("mantém as UTMs da sessão quando a URL vem sem parâmetros", () => {
    const storage = storageFalso();
    capturarOrigem("?utm_source=google&utm_content=a01", storage);
    reiniciarOrigemParaTestes();
    const segunda = capturarOrigem("", storage);
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

  describe("limparEndereco (spec §8, endereço sem termo de busca)", () => {
    afterEach(() => window.history.replaceState(null, "", "/"));

    it("tira utm_term e UTMs fora da convenção, mantendo caminho, gclid e UTMs válidas", () => {
      window.history.replaceState(null, "", "/?utm_source=google&utm_term=dor+no+joelho&gclid=abc.1&utm_campaign=joelho");
      limparEndereco();
      expect(window.location.pathname + window.location.search).toBe("/?utm_source=google&gclid=abc.1");
    });

    it("mantém gbraid, wbraid, gad_source, outros parâmetros, o caminho e a âncora", () => {
      window.history.replaceState(null, "", "/onde-atende?gad_source=1&utm_term=artrose&gbraid=0AAA&wbraid=Cj0B&cidade=tuntum&utm_medium=cpc#mapa");
      limparEndereco();
      expect(window.location.pathname + window.location.search + window.location.hash).toBe(
        "/onde-atende?gad_source=1&gbraid=0AAA&wbraid=Cj0B&cidade=tuntum&utm_medium=cpc#mapa",
      );
    });

    it("tira utm_* sem convenção (ex.: utm_id), que não dá para validar", () => {
      window.history.replaceState(null, "", "/?utm_id=joelho+dor&utm_content=a01");
      limparEndereco();
      expect(window.location.search).toBe("?utm_content=a01");
    });

    it("valida o valor inteiro: '=' literal no valor não esconde texto livre (R24, crítico)", () => {
      window.history.replaceState(null, "", "/?utm_content=a01=dor+no+joelho&gclid=Cj0.KCQ_a-1&utm_source=google");
      limparEndereco();
      expect(window.location.search).toBe("?gclid=Cj0.KCQ_a-1&utm_source=google");
    });

    it("'=' no valor também sai quando codificado (%3D)", () => {
      window.history.replaceState(null, "", "/?utm_campaign=c01%3Djoelho&gclid=abc.1");
      limparEndereco();
      expect(window.location.search).toBe("?gclid=abc.1");
    });

    it("ignora a caixa: UTM_TERM, Utm_Term e UTM_CONTENT com texto livre saem (R24, importante)", () => {
      window.history.replaceState(null, "", "/?UTM_TERM=dor+no+joelho&Utm_Term=artrose&UTM_CONTENT=dor+no+ombro&gclid=abc.1&GAD_SOURCE=1&gbraid=0AAA");
      limparEndereco();
      expect(window.location.search).toBe("?gclid=abc.1&gbraid=0AAA");
    });

    describe("só o permitido fica na barra (parecer R36, item 3)", () => {
      const GCLID = "Cj0KCQjw-_%2Babc%3D%3D.1";

      it("parâmetros livres saem; gclid, gbraid, wbraid, gad_source, cidade válida e UTMs válidas ficam", () => {
        window.history.replaceState(null, "", `/?sintoma=dor+no+joelho&gclid=${GCLID}&fbclid=IwAR1&gbraid=0AAA&msclkid=x&wbraid=Cj0B&gad_source=1&cidade=tuntum&utm_source=google&ref=abc#x`);
        limparEndereco();
        expect(window.location.search + window.location.hash).toBe(`?gclid=${GCLID}&gbraid=0AAA&wbraid=Cj0B&gad_source=1&cidade=tuntum&utm_source=google#x`);
      });

      it("cidade fora da lista sai, inclusive com a caixa diferente", () => {
        window.history.replaceState(null, "", `/?cidade=dor+no+joelho&gclid=${GCLID}&cidade=TUNTUM&Cidade=tuntum`);
        limparEndereco();
        expect(window.location.search).toBe(`?gclid=${GCLID}`);
      });

      it("repetidos: cada ocorrência é validada; o gclid fica intacto", () => {
        window.history.replaceState(null, "", `/?cidade=balsas&cidade=joelho&utm_source=google&utm_source=dor&sintoma=a&sintoma=b&gclid=${GCLID}`);
        limparEndereco();
        expect(window.location.search).toBe(`?cidade=balsas&utm_source=google&gclid=${GCLID}`);
      });

      it("chaves codificadas são lidas decodificadas: %73intoma sai, %63idade válida fica como veio", () => {
        window.history.replaceState(null, "", `/?%73intoma=dor&%63idade=balsas&gclid=${GCLID}&%75tm_term=artrose`);
        limparEndereco();
        expect(window.location.search).toBe(`?%63idade=balsas&gclid=${GCLID}`);
      });

      it("identificadores do Ads em maiúsculas saem (o Google só lê minúsculo); o valor do gclid não muda de caixa", () => {
        window.history.replaceState(null, "", "/?GCLID=abc&Gbraid=1&WBRAID=2&gclid=AbC.XyZ-1");
        limparEndereco();
        expect(window.location.search).toBe("?gclid=AbC.XyZ-1");
      });

      it("gad_campaignid fica com o valor como veio, junto de gad_source, se seguir [A-Za-z0-9_-]{1,100}", () => {
        window.history.replaceState(null, "", `/?gad_source=1&gad_campaignid=21234567890&gclid=${GCLID}&sintoma=dor`);
        limparEndereco();
        expect(window.location.search).toBe(`?gad_source=1&gad_campaignid=21234567890&gclid=${GCLID}`);
      });

      it("gad_campaignid fora do padrão sai (texto livre, codificado, vazio ou longo demais)", () => {
        const longo = "a".repeat(101);
        window.history.replaceState(null, "", `/?gad_source=1&gad_campaignid=dor+no+joelho&gad_campaignid=abc%20def&gad_campaignid=&gad_campaignid=${longo}&gad_campaignid=Ab_c-9&GAD_CAMPAIGNID=1`);
        limparEndereco();
        expect(window.location.search).toBe("?gad_source=1&gad_campaignid=Ab_c-9");
      });

      it("só parâmetros livres: a barra fica sem query", () => {
        window.history.replaceState(null, "", "/onde-atende?sintoma=dor+no+joelho&nome=maria");
        limparEndereco();
        expect(window.location.pathname + window.location.search).toBe("/onde-atende");
      });
    });

    it("utm_* em maiúsculas sai mesmo com valor da convenção (só o nome minúsculo é aprovado)", () => {
      window.history.replaceState(null, "", "/?UTM_SOURCE=google&utm_source=google");
      limparEndereco();
      expect(window.location.search).toBe("?utm_source=google");
    });

    it("urlLimpa (pagina_limpa) segue a mesma regra: valor inteiro e caixa", () => {
      expect(urlLimpa("https://lp-dr-santos.vercel.app/?utm_content=a01=dor+no+joelho&utm_source=google")).toBe(
        "https://lp-dr-santos.vercel.app/?utm_source=google",
      );
      expect(urlLimpa("https://lp-dr-santos.vercel.app/?UTM_TERM=dor&UTM_CONTENT=dor+no+ombro&Utm_Source=google&utm_medium=cpc")).toBe(
        "https://lp-dr-santos.vercel.app/?utm_medium=cpc",
      );
    });

    it("sem nada a tirar, não chama o replaceState", () => {
      window.history.replaceState(null, "", "/?utm_source=google&utm_campaign=c01&gclid=abc.1");
      const trocar = vi.spyOn(window.history, "replaceState");
      limparEndereco();
      expect(trocar).not.toHaveBeenCalled();
      trocar.mockRestore();
    });
  });
});
