// Gera tracking/gtm-container-lp-dr-santos.json (importação do GTM, exportFormatVersion 2).
// Uso: node tracking/gerar-conteiner.mjs
// Regras: spec §8 e §20 e parecer R17. Sem utm_term, sem gclid no GA4, sem Click URL e sem Click Text. page_location = pagina_limpa.
import fs from "node:fs";
import path from "node:path";

const CONTA = "0";
const CONTEINER = "0";
const INICIALIZACAO = "2147479573"; // acionador nativo "Initialization - All Pages"
const base = { accountId: CONTA, containerId: CONTEINER };
const consentimento = { consentStatus: "NOT_NEEDED" }; // só as verificações nativas das tags do Google

/** Eventos e parâmetros da spec §8 (dataLayer). */
const EVENTOS = {
  clique_whatsapp: ["local_cta", "cidade", "local", "utm_source", "utm_medium", "utm_campaign", "utm_content"],
  autoavaliacao_etapa: ["etapa"],
  autoavaliacao_concluida: [],
  autoavaliacao_pulada: ["etapa"],
  seletor_cidade: ["cidade"],
  troca_aba_cidade: ["cidade", "regiao"],
  como_chegar: ["local", "cidade"],
  faq_aberta: ["pergunta"],
  profundidade_rolagem: ["percentual"],
};

const CHAVES_DL = ["pagina_limpa", ...new Set(Object.values(EVENTOS).flat())];

const t = (key, value) => ({ type: "TEMPLATE", key, value });
const b = (key, value) => ({ type: "BOOLEAN", key, value: String(value) });
const tabela = (key, linhas) => ({
  type: "LIST",
  key,
  list: linhas.map(([nome, valor]) => ({ type: "MAP", map: [t("parameter", nome), t("parameterValue", valor)] })),
});

let proximoId = 1;
const id = () => String(proximoId++);

// Variáveis
const variable = [];
const constante = (name, value) => variable.push({ ...base, variableId: id(), name, type: "c", parameter: [t("value", value)], formatValue: {} });
constante("GA4 - ID de medição", "PREENCHER_G-XXXXXXXXXX");
constante("Ads - ID de conversão", "PREENCHER_ID_NUMERICO_DO_AW");
constante("Ads - rótulo de conversão", "PREENCHER_ROTULO");
for (const chave of CHAVES_DL) {
  variable.push({
    ...base,
    variableId: id(),
    name: `DLV - ${chave}`,
    type: "v",
    parameter: [{ type: "INTEGER", key: "dataLayerVersion", value: "2" }, b("setDefaultValue", false), t("name", chave)],
    formatValue: {},
  });
}

// Acionadores
const trigger = [];
const acionadorDe = {};
for (const evento of Object.keys(EVENTOS)) {
  const triggerId = id();
  acionadorDe[evento] = triggerId;
  trigger.push({
    ...base,
    triggerId,
    name: `Evento - ${evento}`,
    type: "CUSTOM_EVENT",
    customEventFilter: [{ type: "EQUALS", parameter: [t("arg0", "{{_event}}"), t("arg1", evento)] }],
  });
}

// Tags
const tag = [];
const novaTag = (name, type, parameter, firingTriggerId) =>
  tag.push({
    ...base,
    tagId: id(),
    name,
    type,
    parameter,
    firingTriggerId: [firingTriggerId],
    tagFiringOption: "ONCE_PER_EVENT",
    monitoringMetadata: { type: "MAP" },
    consentSettings: consentimento,
  });

novaTag(
  "GA4 - Google tag",
  "googtag",
  [t("tagId", "{{GA4 - ID de medição}}"), tabela("configSettingsTable", [["page_location", "{{DLV - pagina_limpa}}"]])],
  INICIALIZACAO,
);

for (const [evento, params] of Object.entries(EVENTOS)) {
  novaTag(
    `GA4 - Evento - ${evento}`,
    "gaawe",
    [
      t("eventName", evento),
      t("measurementIdOverride", "{{GA4 - ID de medição}}"),
      b("sendEcommerceData", false),
      tabela("eventSettingsTable", [
        ["page_location", "{{DLV - pagina_limpa}}"],
        ...params.map((p) => [p, `{{DLV - ${p}}}`]),
      ]),
    ],
    acionadorDe[evento],
  );
}

// Carrega a biblioteca do Ads na inicialização: sem isso ela só baixa no primeiro clique e a
// conversão sai depois da navegação para o wa.me (validação de 24/09/2026).
novaTag("Ads - Google tag", "googtag", [t("tagId", "AW-{{Ads - ID de conversão}}")], INICIALIZACAO);

novaTag(
  "Ads - Vinculador de conversões",
  "gclidw",
  [b("enableCrossDomain", false), b("enableUrlPassthrough", false), b("enableCookieOverrides", false)],
  INICIALIZACAO,
);

novaTag(
  "Ads - Conversão - clique_whatsapp",
  "awct",
  [
    t("conversionId", "{{Ads - ID de conversão}}"),
    t("conversionLabel", "{{Ads - rótulo de conversão}}"),
    b("enableConversionLinker", true),
    t("conversionCookiePrefix", "_gcl"),
    b("enableNewCustomerReporting", false),
    b("enableProductReporting", false),
    b("enableEnhancedConversion", false),
    b("enableShippingData", false),
    b("rdp", false),
  ],
  acionadorDe.clique_whatsapp,
);

const container = {
  path: `accounts/${CONTA}/containers/${CONTEINER}`,
  ...base,
  name: "LP Dr. Patrick Santos",
  publicId: "GTM-XXXXXXX",
  usageContext: ["WEB"],
};

const exportacao = {
  exportFormatVersion: 2,
  exportTime: "2026-09-24 00:00:00",
  containerVersion: {
    path: `accounts/${CONTA}/containers/${CONTEINER}/versions/0`,
    ...base,
    containerVersionId: "0",
    container,
    tag,
    trigger,
    variable,
    builtInVariable: [{ ...base, type: "EVENT", name: "Event" }],
  },
};

const destino = path.resolve(import.meta.dirname, "gtm-container-lp-dr-santos.json");
fs.writeFileSync(destino, `${JSON.stringify(exportacao, null, 2)}\n`);
console.log(`gtm: ${tag.length} tags, ${trigger.length} acionadores, ${variable.length} variáveis -> ${path.basename(destino)}`);
