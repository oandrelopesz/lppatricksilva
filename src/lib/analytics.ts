import { GTM_ID } from "@/config";
import { urlLimpa } from "@/lib/origem";

export type ParametrosEvento = Record<string, string | number | undefined>;

export interface OpcoesEvento {
  /** Chamado uma vez: pelo GTM (eventCallback) ou pelo tempo-limite, o que vier primeiro. */
  aoConcluir?: () => void;
  tempoLimiteMs?: number;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    /** Criado pelo gtm.js quando o contêiner termina de carregar. */
    google_tag_manager?: unknown;
  }
}

/** Tempo-limite do clique_whatsapp: 800 ms com o GTM já carregado; 2.000 ms se ainda não (spec §7). */
const LIMITE_CLIQUE_COM_GTM_MS = 800;
const LIMITE_CLIQUE_SEM_GTM_MS = 2000;

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
  // O GTM já carregado confirma a tag rápido; carregando agora, o limite maior dá tempo à conversão.
  const gtmPronto = Boolean(window.google_tag_manager);
  if (evento === "clique_whatsapp") {
    // O clique pode vir antes do carregamento agendado: carrega o GTM na hora.
    carregarGtm();
    // O modelo do GTM guarda o último valor de cada chave: sem zerar, cidade e local de um clique vazariam para o próximo.
    window.dataLayer.push(Object.fromEntries(CAMPOS_CLIQUE.map((campo) => [campo, undefined])));
  }
  const { aoConcluir, tempoLimiteMs = gtmPronto ? LIMITE_CLIQUE_COM_GTM_MS : LIMITE_CLIQUE_SEM_GTM_MS } = opcoes;
  if (!aoConcluir) {
    window.dataLayer.push({ event: evento, ...limpo });
    return;
  }
  let concluido = false;
  const concluir = () => {
    if (concluido) return;
    concluido = true;
    aoConcluir();
  };
  window.dataLayer.push({ event: evento, ...limpo, eventCallback: concluir, eventTimeout: tempoLimiteMs });
  window.setTimeout(concluir, tempoLimiteMs);
}
