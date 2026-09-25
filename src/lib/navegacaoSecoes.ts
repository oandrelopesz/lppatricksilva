import { SECOES, atualizarUrl, ehSecao, irParaSecao, secaoDaUrl } from "@/lib/secoes";

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

/** Intervalo mínimo entre trocas de URL durante a rolagem. */
const INTERVALO_URL_MS = 300;

/**
 * Marca a seção dominante (a que cruza uma faixa fina no meio da viewport) e troca a URL para
 * /<slug> com replaceState, sem empilhar histórico, no máximo uma vez a cada 300 ms.
 */
export function acompanharRolagem(): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  let pendente: string | undefined;
  let espera: ReturnType<typeof setTimeout> | undefined;

  const aplicar = () => {
    espera = undefined;
    if (pendente) atualizarUrl(pendente, { substituir: true });
  };

  const observador = new IntersectionObserver(
    (entradas) => {
      const dominante = entradas.filter((entrada) => entrada.isIntersecting).pop();
      if (!dominante) return;
      pendente = dominante.target.id;
      if (espera === undefined) espera = setTimeout(aplicar, INTERVALO_URL_MS);
    },
    { rootMargin: "-45% 0px -54% 0px", threshold: 0 },
  );
  for (const slug of SECOES) {
    const secao = document.getElementById(slug);
    if (secao) observador.observe(secao);
  }
  return () => {
    observador.disconnect();
    if (espera !== undefined) clearTimeout(espera);
  };
}

/** Liga a navegação por seções. Devolve a função que desliga (efeito do React). */
export function iniciarNavegacaoPorSecoes(): () => void {
  rolarParaSecaoDaUrl();
  const desligarLinks = interceptarLinksDeSecao();
  const desligarRolagem = acompanharRolagem();
  return () => {
    desligarLinks();
    desligarRolagem();
  };
}
