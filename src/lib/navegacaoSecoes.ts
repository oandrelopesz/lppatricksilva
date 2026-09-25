import { irParaSecao, secaoDaUrl } from "@/lib/secoes";

/** Carga em /<slug> (sitelink): rola até a seção sem animação. Só no navegador, depois da hidratação. */
export function rolarParaSecaoDaUrl(): void {
  const slug = secaoDaUrl(window.location.pathname);
  if (slug) irParaSecao(slug);
}

/** Liga a navegação por seções. Devolve a função que desliga (efeito do React). */
export function iniciarNavegacaoPorSecoes(): () => void {
  rolarParaSecaoDaUrl();
  return () => {};
}
