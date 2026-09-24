import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const arquivo = path.resolve(import.meta.dirname, "../../tracking/gtm-container-lp-dr-santos.json");
const bruto = fs.readFileSync(arquivo, "utf8");
const exportacao = JSON.parse(bruto);
const versao = exportacao.containerVersion;

interface Parametro {
  key?: string;
  value?: string;
  list?: { map: Parametro[] }[];
}
interface Tag {
  name: string;
  type: string;
  parameter: Parametro[];
  firingTriggerId: string[];
  consentSettings: { consentStatus: string };
}

/** Eventos e parâmetros da spec §8. */
const EVENTOS: Record<string, string[]> = {
  clique_whatsapp: ["local_cta", "cidade", "local", "ref", "utm_source", "utm_medium", "utm_campaign", "utm_content"],
  autoavaliacao_etapa: ["etapa"],
  autoavaliacao_concluida: [],
  autoavaliacao_pulada: ["etapa"],
  seletor_cidade: ["cidade"],
  troca_aba_cidade: ["cidade", "regiao"],
  como_chegar: ["local", "cidade"],
  faq_aberta: ["pergunta"],
  profundidade_rolagem: ["percentual"],
};

const INICIALIZACAO = "2147479573";
const tags: Tag[] = versao.tag;
const valor = (tag: Tag, chave: string) => tag.parameter.find((p) => p.key === chave)?.value;
const tabela = (tag: Tag, chave: string) =>
  Object.fromEntries(
    (tag.parameter.find((p) => p.key === chave)?.list ?? []).map((linha) => [
      linha.map.find((m) => m.key === "parameter")!.value,
      linha.map.find((m) => m.key === "parameterValue")!.value,
    ]),
  );
const idAcionador = (evento: string) =>
  versao.trigger.find(
    (t: { type: string; customEventFilter: Parametro[] & { parameter: Parametro[] }[] }) =>
      t.type === "CUSTOM_EVENT" && t.customEventFilter[0].parameter.some((p) => p.key === "arg1" && p.value === evento),
  )?.triggerId;

describe("contêiner do GTM", () => {
  it("é uma exportação no formato 2", () => {
    expect(exportacao.exportFormatVersion).toBe(2);
    expect(versao.container.usageContext).toEqual(["WEB"]);
  });

  it("não referencia utm_term, Click URL nem Click Text", () => {
    expect(bruto).not.toMatch(/utm_term/i);
    expect(bruto).not.toMatch(/click ?url|click ?text|CLICK_URL|CLICK_TEXT/i);
    expect(bruto).not.toMatch(/gtm\.element(Url|Text)/);
  });

  it("o gclid nunca vai ao GA4: sem variável nem parâmetro gclid", () => {
    expect(bruto).not.toMatch(/DLV - gclid/);
    expect(bruto).not.toMatch(/"value": "gclid"/);
    for (const tag of tags.filter((t) => t.type === "gaawe" || t.type === "googtag")) {
      expect(JSON.stringify(tag)).not.toMatch(/gclid/i);
    }
  });

  it("as três constantes existem e estão marcadas para preencher", () => {
    for (const nome of ["GA4 - ID de medição", "Ads - ID de conversão", "Ads - rótulo de conversão"]) {
      const v = versao.variable.find((x: { name: string }) => x.name === nome);
      expect(v?.type).toBe("c");
      expect(v.parameter[0].value).toMatch(/^PREENCHER/);
    }
  });

  it("Google tag do GA4 na inicialização com page_location = pagina_limpa", () => {
    const google = tags.find((t) => t.type === "googtag")!;
    expect(valor(google, "tagId")).toBe("{{GA4 - ID de medição}}");
    expect(google.firingTriggerId).toEqual([INICIALIZACAO]);
    expect(tabela(google, "configSettingsTable").page_location).toBe("{{DLV - pagina_limpa}}");
  });

  it.each(Object.entries(EVENTOS))("%s tem acionador e tag GA4 com os parâmetros da spec", (evento, params) => {
    const id = idAcionador(evento);
    expect(id).toBeDefined();
    const tag = tags.find((t) => t.type === "gaawe" && valor(t, "eventName") === evento)!;
    expect(tag).toBeDefined();
    expect(tag.firingTriggerId).toEqual([id]);
    expect(valor(tag, "measurementIdOverride")).toBe("{{GA4 - ID de medição}}");
    const enviados = tabela(tag, "eventSettingsTable");
    expect(Object.keys(enviados).sort()).toEqual([...params, "page_location"].sort());
    for (const p of params) expect(enviados[p]).toBe(`{{DLV - ${p}}}`);
    expect(enviados.page_location).toBe("{{DLV - pagina_limpa}}");
  });

  it("não há tag GA4 para evento fora da spec", () => {
    const nomes = tags.filter((t) => t.type === "gaawe").map((t) => valor(t, "eventName"));
    expect(nomes.sort()).toEqual(Object.keys(EVENTOS).sort());
  });

  it("conversão do Google Ads só em clique_whatsapp, com as constantes", () => {
    const conversoes = tags.filter((t) => t.type === "awct");
    expect(conversoes).toHaveLength(1);
    expect(conversoes[0].firingTriggerId).toEqual([idAcionador("clique_whatsapp")]);
    expect(valor(conversoes[0], "conversionId")).toBe("{{Ads - ID de conversão}}");
    expect(valor(conversoes[0], "conversionLabel")).toBe("{{Ads - rótulo de conversão}}");
  });

  it("vinculador de conversões na inicialização", () => {
    const vinculador = tags.find((t) => t.type === "gclidw")!;
    expect(vinculador.firingTriggerId).toEqual([INICIALIZACAO]);
  });

  it("toda tag usa só as verificações de consentimento nativas do Google", () => {
    for (const tag of tags) expect(tag.consentSettings).toEqual({ consentStatus: "NOT_NEEDED" });
  });

  it("toda variável {{...}} usada existe", () => {
    const nomes = new Set([...versao.variable.map((v: { name: string }) => v.name), "_event"]);
    for (const [, nome] of bruto.matchAll(/\{\{([^}]+)\}\}/g)) expect(nomes).toContain(nome);
  });

  it("nenhum parâmetro de saúde", () => {
    expect(bruto).not.toMatch(/regiao_corpo|limitacao|tratamento|resumo|resposta/i);
  });
});
