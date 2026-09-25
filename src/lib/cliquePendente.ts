import { navegacao } from "@/components/CtaWhatsApp";
import { carregarGtm, track } from "@/lib/analytics";

/** Clique no WhatsApp segurado pelo script inline do index.html antes da hidratação. */
export interface CliquePendente {
  href: string;
  localCta?: string;
  /** performance.now() do clique original. */
  t: number;
  alvo?: Element;
}

declare global {
  interface Window {
    __lpHidratado?: boolean;
    __lpCliquePendente?: CliquePendente;
    __lpSeguranca?: number;
  }
}

/** Evento que entrega o clique segurado ao próprio CtaWhatsApp (mesmo caminho de um clique normal). */
export const EVENTO_CLIQUE_SEGURADO = "lp:clique-segurado";

/**
 * Chamada na hidratação: a partir daqui o React trata os cliques. Se havia clique segurado, cancela a
 * navegação de segurança, carrega o GTM na hora e registra o clique_whatsapp; a navegação segue a
 * regra do clique (analytics.track), com o teto contado do clique original.
 */
export function processarCliquePendente(): void {
  window.__lpHidratado = true;
  const pendente = window.__lpCliquePendente;
  if (!pendente) return;
  delete window.__lpCliquePendente;
  if (window.__lpSeguranca !== undefined) {
    window.clearTimeout(window.__lpSeguranca);
    delete window.__lpSeguranca;
  }
  carregarGtm();
  const alvo = pendente.alvo?.isConnected ? pendente.alvo : undefined;
  const tratadoPeloCta =
    alvo !== undefined &&
    !alvo.dispatchEvent(new CustomEvent(EVENTO_CLIQUE_SEGURADO, { cancelable: true, detail: { t: pendente.t } }));
  if (tratadoPeloCta) return;
  track("clique_whatsapp", { local_cta: pendente.localCta }, { inicioMs: pendente.t, aoConcluir: () => navegacao.ir(pendente.href) });
}
