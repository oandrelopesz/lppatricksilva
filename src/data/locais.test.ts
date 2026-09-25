import { describe, expect, it } from "vitest";
import { CIDADES, REGIOES, buscarCidade, cidadesDaRegiao, todosOsLocais, urlEmbedMapa } from "./locais";

describe("locais", () => {
  it("tem 14 locais em 11 cidades e 2 regiões", () => {
    expect(CIDADES).toHaveLength(11);
    expect(todosOsLocais()).toHaveLength(14);
    expect(REGIOES.map((r) => r.id)).toEqual(["sul-maranhense", "centro-maranhense"]);
  });

  it("Balsas tem 3 locais e Barra do Corda tem 2", () => {
    expect(buscarCidade("balsas")?.locais).toHaveLength(3);
    expect(buscarCidade("barra-do-corda")?.locais).toHaveLength(2);
  });

  it("cada região lista as cidades do brief na ordem", () => {
    expect(cidadesDaRegiao("sul-maranhense").map((c) => c.nome)).toEqual([
      "Balsas",
      "São Domingos do Azeitão",
      "São Raimundo das Mangabeiras",
      "Loreto",
    ]);
    expect(cidadesDaRegiao("centro-maranhense").map((c) => c.nome)).toEqual([
      "Presidente Dutra",
      "Fortuna",
      "Gonçalves Dias",
      "São Domingos do Maranhão",
      "Tuntum",
      "Graça Aranha",
      "Barra do Corda",
    ]);
  });

  it("todo local tem nome, endereço com a cidade, logradouro no início e link do brief", () => {
    for (const { cidade, local } of todosOsLocais()) {
      expect(local.nome).not.toBe("");
      expect(local.endereco).toContain(`${cidade.nome}-MA`);
      expect(local.endereco.startsWith(local.logradouro)).toBe(true);
      expect(local.linkComoChegar).toMatch(
        /^https:\/\/(maps\.google\.com\/\?cid=\d+|www\.google\.com\/maps\/search\/\?api=1&query=)/,
      );
    }
  });

  it("ids de cidade e de local são únicos", () => {
    const ids = todosOsLocais().map(({ local }) => local.id);
    expect(new Set(ids).size).toBe(14);
    expect(new Set(CIDADES.map((c) => c.id)).size).toBe(11);
  });

  it("marca os dois hospitais", () => {
    const hospitais = todosOsLocais().filter(({ local }) => local.tipo === "hospital").map(({ local }) => local.nome);
    expect(hospitais).toEqual(["Hospital São José", "Hospital Florêncio Brandes"]);
  });

  it("não inventa dias de atendimento", () => {
    expect(todosOsLocais().every(({ local }) => local.diasAtendimento === undefined)).toBe(true);
  });

  it("buscarCidade ignora id inválido ou vazio", () => {
    expect(buscarCidade("sao-paulo")).toBeUndefined();
    expect(buscarCidade(null)).toBeUndefined();
    expect(buscarCidade(undefined)).toBeUndefined();
  });

  it("monta a URL de embed com nome e endereço", () => {
    const local = buscarCidade("fortuna")!.locais[0];
    const url = new URL(urlEmbedMapa(local));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps");
    expect(url.searchParams.get("output")).toBe("embed");
    expect(url.searchParams.get("q")).toBe("Clínica Risalva Carvalho R. Quinze de Novembro, 741, Fortuna-MA, 65695-000");
  });

  it("usa o nome da ficha do Maps no embed quando ele difere", () => {
    const local = buscarCidade("tuntum")!.locais[0];
    expect(new URL(urlEmbedMapa(local)).searchParams.get("q")).toContain("CMT Centro Médico de Tuntum e Laboratório");
  });
  describe("embed do mapa por local (conferido no navegador)", () => {
    const local = (id: string) => todosOsLocais().find(({ local }) => local.id === id)!.local;
    const CORRIGIDOS: Record<string, string> = {
      "clinica-mais-saude": "https://www.google.com/maps?cid=6068533600021052492&output=embed",
      clinimed: `https://www.google.com/maps?${new URLSearchParams({ q: "Rua 28 de Julho, Loreto - MA", output: "embed" })}`,
      "sd-med": "https://www.google.com/maps?cid=8715891456907011906&output=embed",
      "cm-lab-graca-aranha": `https://www.google.com/maps?${new URLSearchParams({ q: "R. São Francisco, Graça Aranha - MA, 65785-000", output: "embed" })}`,
      "clinica-mais-familia": "https://www.google.com/maps?cid=492768669301912196&output=embed",
    };

    for (const [id, esperado] of Object.entries(CORRIGIDOS)) {
      it(`${id}: embed próprio`, () => {
        expect(urlEmbedMapa(local(id))).toBe(esperado);
      });
    }

    it("os outros 9 seguem o padrão (nome da ficha ou nome, mais o endereço)", () => {
      const outros = todosOsLocais().filter(({ local }) => !(local.id in CORRIGIDOS));
      expect(outros.map(({ local }) => local.id)).toEqual([
        "mais-centro-medico",
        "hospital-sao-jose",
        "clinica-santa-maria",
        "mendesclin",
        "clinica-levive",
        "clinica-risalva-carvalho",
        "begmed",
        "cm-lab-tuntum",
        "hospital-florencio-brandes",
      ]);
      for (const { local } of outros) {
        const url = new URL(urlEmbedMapa(local));
        expect(url.origin + url.pathname).toBe("https://www.google.com/maps");
        expect(url.searchParams.get("output")).toBe("embed");
        expect(url.searchParams.get("q")).toBe(`${local.nomeNoMaps ?? local.nome} ${local.endereco}`);
      }
    });

    it("nenhuma busca de embed leva (filial) ou (matriz)", () => {
      for (const { local } of todosOsLocais()) {
        const q = new URL(urlEmbedMapa(local)).searchParams.get("q") ?? "";
        expect(q).not.toMatch(/\((filial|matriz)\)/);
      }
    });
  });

  describe("endereços confirmados no destaque Clínicas do Instagram", () => {
    const local = (id: string) => todosOsLocais().find(({ local }) => local.id === id)!.local;

    it("Levive confirmada: sem a observação sobre a Pró Saúde", () => {
      expect(local("clinica-levive").observacao).toBeUndefined();
    });

    it("Mendesclin: endereço do Instagram, com a divergência da ficha do Maps anotada", () => {
      expect(local("mendesclin").observacao).toBe(
        "Endereço confirmado no Instagram do médico (Praça do Mercado Central, nº 14); a ficha do Google Maps mostra R. Gonçalves Dias.",
      );
    });

    it("CM LAB de Graça Aranha com o CEP", () => {
      expect(local("cm-lab-graca-aranha").endereco).toBe("Rua São Francisco, s/n, Centro, Graça Aranha-MA, 65785-000");
      expect(local("cm-lab-graca-aranha").cep).toBe("65785-000");
      expect(local("cm-lab-graca-aranha").observacao).toBe("Sem número (confirmado no Instagram) e sem ficha no Google Maps.");
    });

    it("Clinimed sem número, confirmado no Instagram", () => {
      expect(local("clinimed").observacao).toBe("Sem número (confirmado no Instagram) e sem ficha no Google Maps.");
    });
  });
});
