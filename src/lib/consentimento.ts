export type Escolha = "aceito" | "recusado";

const CHAVE = "lp_consentimento_v1";

export function lerConsentimento(): Escolha | null {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === "aceito" || valor === "recusado" ? valor : null;
  } catch {
    return null;
  }
}

export function salvarConsentimento(escolha: Escolha): void {
  try {
    localStorage.setItem(CHAVE, escolha);
  } catch {
    /* storage bloqueado: vale só nesta página */
  }
}

export function aplicarConsentimento(escolha: Escolha): void {
  const valor = escolha === "aceito" ? "granted" : "denied";
  window.dataLayer = window.dataLayer || [];
  // gtag precisa do objeto arguments, não de um array.
  (function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
  })("consent", "update", {
    ad_storage: valor,
    ad_user_data: valor,
    ad_personalization: valor,
    analytics_storage: valor,
  });
}
