import { ADS_ID_CONVERSAO, GTM_ID } from "@/config";
import { urlLimpa } from "@/lib/origem";

export type ParametrosEvento = Record<string, string | number | undefined>;

export interface OpcoesEvento {
  /**
   * Chamado uma vez: 150 ms depois de a requisição de conversão do Ads sair ou no teto (1.500 ms com o
   * GTM pronto no clique, 3.000 ms sem ele), o que vier primeiro.
   */
  aoConcluir?: () => void;
  /** performance.now() do clique original (clique segurado antes da hidratação); o teto conta dele. */
  inicioMs?: number;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    /** Criado pelo gtm.js quando o contêiner termina de carregar. */
    google_tag_manager?: unknown;
  }
}

/**
 * O eventCallback do GTM volta assim que as tags são despachadas, antes de a conversão sair (validações
 * do Tracking), então não decide a navegação: ela sai 150 ms depois de a requisição de conversão ser
 * vista ou no teto, contado do clique (spec §8).
 */
const TETO_COM_GTM_MS = 1500;
const TETO_SEM_GTM_MS = 3000;
const DEPOIS_DA_CONVERSAO_MS = 150;
/** Clique antigo (segurado antes da hidratação) cujo teto já passou: espera ao menos isto depois do envio. */
const MINIMO_DEPOIS_DO_ENVIO_MS = 300;

/**
 * Só a conversão do Ads com o nosso ID (parecer R28): pagead/conversion/<ID> ou pagead/1p-conversion/<ID>
 * (ID no segmento do caminho) ou ccm/collect com en=conversion e tid=AW-<ID>. Um ccm/collect de
 * page_view, com o mesmo ID, não conta.
 */
function ehRequisicaoDeConversao(nome: string): boolean {
  let url: URL;
  try {
    url = new URL(nome);
  } catch {
    return false;
  }
  const pagead = url.pathname.match(/\/pagead\/(?:1p-)?conversion\/(\d+)(?:\/|$)/);
  if (pagead) return pagead[1] === ADS_ID_CONVERSAO;
  if (url.pathname.endsWith("/ccm/collect")) {
    return url.searchParams.get("en") === "conversion" && url.searchParams.get("tid") === `AW-${ADS_ID_CONVERSAO}`;
  }
  return false;
}

/** Campos opcionais do clique_whatsapp, zerados antes de cada clique (parecer R17). */
export const CAMPOS_CLIQUE = [
  "local_cta",
  "intencao",
  "cidade",
  "local",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

let gtmCarregado = false;

/**
 * Põe na fila a URL corrente sem utm_term, texto livre, âncora e gclid, para o GTM usar como
 * page_location do GA4. Chamada na carga e a cada troca de URL por seção (lp:secao).
 * O gclid nunca vai ao GA4 (parecer R17); o vinculador e a conversão do Ads o leem da URL de entrada.
 */
export function registrarPagina(): void {
  const url = new URL(urlLimpa(window.location.href));
  url.searchParams.delete("gclid");
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ pagina_limpa: url.toString() });
}

export function carregarGtm(): void {
  if (gtmCarregado || typeof document === "undefined") return;
  const id = import.meta.env.VITE_GTM_ID ?? GTM_ID;
  if (!id) return;
  gtmCarregado = true;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  script.dataset.gtm = "";
  document.head.appendChild(script);
}

/** Limite para o GTM carregar mesmo sem tempo ocioso (parecer R18). */
const LIMITE_OCIOSO_MS = 1500;

/** Primeira interação que antecipa o GTM (spec §7 e §8). */
const INTERACOES = ["pointerdown", "touchstart", "keydown", "scroll"] as const;

/**
 * O GTM carrega no que vier primeiro: o tempo ocioso (requestIdleCallback com limite de 1,5 s,
 * garantido também por setTimeout, com ou sem a API) ou a primeira interação (pointerdown,
 * touchstart, keydown ou scroll, ouvintes passivos e de uma vez só, que saem no primeiro disparo).
 */
export function agendarGtm(): void {
  let feito = false;
  const opcoesOuvinte = { passive: true, once: true } as const;
  const carregar = () => {
    if (feito) return;
    feito = true;
    for (const tipo of INTERACOES) window.removeEventListener(tipo, carregar, { capture: false });
    carregarGtm();
  };
  for (const tipo of INTERACOES) window.addEventListener(tipo, carregar, opcoesOuvinte);
  window.requestIdleCallback?.(carregar, { timeout: LIMITE_OCIOSO_MS });
  window.setTimeout(carregar, LIMITE_OCIOSO_MS);
}

export function track(evento: string, params: ParametrosEvento = {}, opcoes: OpcoesEvento = {}): void {
  if (typeof window === "undefined") return;
  const limpo = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
  window.dataLayer = window.dataLayer || [];
  // Com o GTM já na página, a conversão sai mais cedo (teto de 1.500 ms); carregando agora, 3.000 ms.
  const gtmPronto = Boolean(window.google_tag_manager);
  if (evento === "clique_whatsapp") {
    // O clique pode vir antes do carregamento agendado: carrega o GTM na hora.
    carregarGtm();
    // O modelo do GTM guarda o último valor de cada chave: sem zerar, cidade e local de um clique vazariam para o próximo.
    window.dataLayer.push(Object.fromEntries(CAMPOS_CLIQUE.map((campo) => [campo, undefined])));
  }
  const { aoConcluir, inicioMs } = opcoes;
  if (!aoConcluir) {
    window.dataLayer.push({ event: evento, ...limpo });
    return;
  }
  const limpezas: Array<() => void> = [];
  let concluido = false;
  const concluir = () => {
    if (concluido) return;
    concluido = true;
    for (const limpar of limpezas) limpar();
    aoConcluir();
  };

  window.dataLayer.push({ event: evento, ...limpo });
  const inicio = inicioMs ?? performance.now();
  const tetoMs = gtmPronto ? TETO_COM_GTM_MS : TETO_SEM_GTM_MS;
  const restante = Math.max(tetoMs - (performance.now() - inicio), inicioMs === undefined ? 0 : MINIMO_DEPOIS_DO_ENVIO_MS);
  const teto = window.setTimeout(concluir, restante);
  limpezas.push(() => window.clearTimeout(teto));
  if (typeof PerformanceObserver === "undefined") return;
  const observador = new PerformanceObserver((lista) => {
    const viuConversao = lista.getEntries().some((entrada) => entrada.startTime >= inicio && ehRequisicaoDeConversao(entrada.name));
    if (!viuConversao) return;
    observador.disconnect();
    window.setTimeout(concluir, DEPOIS_DA_CONVERSAO_MS);
  });
  try {
    observador.observe({ type: "resource", buffered: true });
    limpezas.push(() => observador.disconnect());
  } catch {
    /* navegador sem esse tipo de entrada: fica o teto */
  }
}
