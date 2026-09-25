import LISTA_SECOES from "@/data/secoes.json";

/**
 * URLs por seção (sitelinks do Google Ads): cada seção tem o id igual ao slug e responde em
 * /<slug>. A mesma lista alimenta o prerender, que grava dist/<slug>/index.html.
 */
export const SECOES: readonly string[] = LISTA_SECOES;

export function ehSecao(valor: string): boolean {
  return SECOES.includes(valor);
}

/** "/onde-atende" ou "/onde-atende/" → "onde-atende"; qualquer outro caminho → undefined. */
export function secaoDaUrl(pathname: string): string | undefined {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  return ehSecao(slug) ? slug : undefined;
}

/**
 * Decisão (a) do parecer R20: quando a URL muda por clique ou rolagem, a primeira seção usa a raiz /.
 * /inicio continua publicado (sitelink) e abre no topo, mas a navegação nunca gera /inicio.
 */
export function caminhoDaSecao(slug: string): string {
  return slug === "inicio" ? "/" : `/${slug}`;
}

function preferirMenosMovimento(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

/**
 * Rola até a seção. O recuo da topbar vem do scroll-padding-top do html. Sem `suave` (ou com
 * prefers-reduced-motion), a rolagem é instantânea mesmo com scroll-behavior: smooth no CSS.
 */
export function irParaSecao(slug: string, { suave = false }: { suave?: boolean } = {}): boolean {
  const secao = document.getElementById(slug);
  if (!secao) return false;
  secao.scrollIntoView({ behavior: suave && !preferirMenosMovimento() ? "smooth" : "instant", block: "start" });
  return true;
}

/** Troca a URL para /<slug> (a raiz para inicio), mantendo a query (UTMs, gclid) e sem âncora. */
export function atualizarUrl(slug: string, { substituir = false }: { substituir?: boolean } = {}): void {
  const destino = caminhoDaSecao(slug) + window.location.search;
  if (destino === window.location.pathname + window.location.search && !window.location.hash) return;
  if (substituir) window.history.replaceState(window.history.state, "", destino);
  else window.history.pushState(window.history.state, "", destino);
}
