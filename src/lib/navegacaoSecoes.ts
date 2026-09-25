import { atualizarUrl, ehSecao, irParaSecao, secaoDaUrl } from "@/lib/secoes";

/** Carga em /<slug> (sitelink): rola até a seção sem animação. Só no navegador, depois da hidratação. */
export function rolarParaSecaoDaUrl(): void {
  const slug = secaoDaUrl(window.location.pathname);
  if (slug) irParaSecao(slug);
}

/**
 * Um único listener delegado: cliques simples em links href="#<slug>" rolam até a seção e empilham
 * /<slug> no histórico. Sem JavaScript, o href="#<slug>" continua funcionando. Clique com
 * modificador, outro botão, âncora que não é seção ou clique já tratado por outro componente
 * seguem o navegador. Voltar/avançar no histórico rola até a seção da URL.
 */
export function interceptarLinksDeSecao(): () => void {
  function aoClicar(evento: MouseEvent) {
    if (evento.defaultPrevented || evento.button !== 0) return;
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    const link = (evento.target as Element | null)?.closest?.("a[href^='#']");
    if (!link) return;
    const slug = link.getAttribute("href")!.slice(1);
    if (!ehSecao(slug) || !document.getElementById(slug)) return;
    evento.preventDefault();
    irParaSecao(slug, { suave: true });
    atualizarUrl(slug);
  }

  function aoNavegarNoHistorico() {
    const slug = secaoDaUrl(window.location.pathname) ?? "inicio";
    if (!irParaSecao(slug)) window.scrollTo({ top: 0, behavior: "instant" });
  }

  document.addEventListener("click", aoClicar);
  window.addEventListener("popstate", aoNavegarNoHistorico);
  return () => {
    document.removeEventListener("click", aoClicar);
    window.removeEventListener("popstate", aoNavegarNoHistorico);
  };
}

/** Liga a navegação por seções. Devolve a função que desliga (efeito do React). */
export function iniciarNavegacaoPorSecoes(): () => void {
  rolarParaSecaoDaUrl();
  const desligarLinks = interceptarLinksDeSecao();
  return () => {
    desligarLinks();
  };
}
