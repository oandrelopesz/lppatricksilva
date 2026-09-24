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
  }
}

let gtmCarregado = false;

/** URL sem utm_term, texto livre e âncora, para o GTM usar como page_location do GA4. */
export function registrarPagina(): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ pagina_limpa: urlLimpa(window.location.href) });
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

/** Depois do primeiro frame, sem esperar gesto. */
export function agendarGtm(): void {
  const agendar = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
  agendar(() => carregarGtm());
}

export function track(evento: string, params: ParametrosEvento = {}, opcoes: OpcoesEvento = {}): void {
  if (typeof window === "undefined") return;
  const limpo = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
  window.dataLayer = window.dataLayer || [];
  // O clique pode vir antes do carregamento agendado: carrega o GTM na hora.
  if (evento === "clique_whatsapp") carregarGtm();
  const { aoConcluir, tempoLimiteMs = 800 } = opcoes;
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
