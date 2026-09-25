/** Escolha de cookies por categoria (parecer R36, decisões do André de 25/09/2026). */
export interface Escolha {
  /** Medição de visitas pelo Google Analytics (analytics_storage). */
  visitas: boolean;
  /** Medição de anúncios pelo Google Ads (ad_storage e ad_user_data). */
  anuncios: boolean;
}

/** Registro guardado: a escolha, a versão do aviso e a data, para demonstrar o consentimento. */
interface Registro extends Escolha {
  versao: string;
  data: string;
}

export const CHAVE_CONSENTIMENTO = "lp_consentimento_v2";
export const VERSAO_CONSENTIMENTO = "2026-09-25";
/** Escolha antiga, de uma camada só ("aceito" ou "recusado"). */
const CHAVE_ANTIGA = "lp_consentimento_v1";

/** Disparado ao salvar uma escolha; os mapas passam a carregar sozinhos se houver aceite. */
export const EVENTO_CONSENTIMENTO = "lp:consentimento";

function valida(valor: unknown): valor is Escolha {
  const v = valor as Partial<Escolha> | null;
  return typeof v === "object" && v !== null && typeof v.visitas === "boolean" && typeof v.anuncios === "boolean";
}

function gravar(escolha: Escolha, agora: Date): void {
  const registro: Registro = { visitas: escolha.visitas, anuncios: escolha.anuncios, versao: VERSAO_CONSENTIMENTO, data: agora.toISOString() };
  localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify(registro));
}

export function lerConsentimento(): Escolha | null {
  try {
    const bruto = localStorage.getItem(CHAVE_CONSENTIMENTO);
    if (bruto !== null) {
      try {
        const registro: unknown = JSON.parse(bruto);
        return valida(registro) ? { visitas: registro.visitas, anuncios: registro.anuncios } : null;
      } catch {
        return null;
      }
    }
    // Migração: aceito liga as duas categorias, recusado desliga as duas.
    const antiga = localStorage.getItem(CHAVE_ANTIGA);
    if (antiga !== "aceito" && antiga !== "recusado") return null;
    const escolha = { visitas: antiga === "aceito", anuncios: antiga === "aceito" };
    gravar(escolha, new Date());
    localStorage.removeItem(CHAVE_ANTIGA);
    return escolha;
  } catch {
    return null;
  }
}

export function salvarConsentimento(escolha: Escolha, agora = new Date()): void {
  try {
    gravar(escolha, agora);
  } catch {
    /* storage bloqueado: vale só nesta página */
  }
  window.dispatchEvent(new CustomEvent<Escolha>(EVENTO_CONSENTIMENTO, { detail: escolha }));
}

export function aceitouAlguma(escolha: Escolha | null): boolean {
  return Boolean(escolha && (escolha.visitas || escolha.anuncios));
}

/** Personalização de anúncios fica sempre negada. */
export function sinaisDoConsentimento(escolha: Escolha) {
  const valor = (ligado: boolean) => (ligado ? "granted" : "denied");
  return {
    analytics_storage: valor(escolha.visitas),
    ad_storage: valor(escolha.anuncios),
    ad_user_data: valor(escolha.anuncios),
    ad_personalization: "denied",
  };
}

export function aplicarConsentimento(escolha: Escolha): void {
  window.dataLayer = window.dataLayer || [];
  // gtag precisa do objeto arguments, não de um array.
  (function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
  })("consent", "update", sinaisDoConsentimento(escolha));
}
