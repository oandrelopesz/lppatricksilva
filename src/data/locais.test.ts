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
});
