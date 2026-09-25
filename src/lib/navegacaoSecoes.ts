import { EVENTO_SECAO, SECOES, anunciarSecao, atualizarUrl, ehSecao, irParaSecao, secaoDaUrl, type DetalheSecao } from "@/lib/secoes";

/** Intervalo mínimo entre trocas de URL durante a rolagem. */
const INTERVALO_URL_MS = 300;
/** Sem o evento scrollend, a atualização passiva volta depois deste tempo. */
const RETOMAR_SEM_SCROLLEND_MS = 1000;
/** Com scrollend, limite de segurança para o caso de a rolagem não acontecer (já estava no destino). */
const RETOMAR_COM_SCROLLEND_MS = 3000;
/** Posição da faixa observada, em fração da altura da viewport (a mesma do rootMargin do observer). */
const FAIXA = 0.45;

/**
 * Navegação explícita (clique, Voltar/Avançar, carga em /<slug>) × atualização passiva pela rolagem:
 * a explícita cancela a troca pendente e suspende a passiva até a rolagem programada terminar
 * (spec §21, parecer R20).
 */
let suspensa = false;
let cancelarTrocaPendente: () => void = () => {};
let encerrarSuspensao: () => void = () => {};
/** Ao retomar, confere a seção uma vez: durante a pausa o observador descartou as interseções. */
let conferirAoRetomar: () => void = () => {};

/**
 * Pausa a atualização passiva enquanto uma rolagem programada acontece. Usada pelas navegações
 * explícitas daqui e pelos componentes que rolam até as abas (mapa, rodapé, seletor).
 */
export function suspenderAtualizacaoPassiva(): void {
  cancelarTrocaPendente();
  encerrarSuspensao();
  suspensa = true;
  const temScrollend = "onscrollend" in window;
  const retomar = () => {
    suspensa = false;
    encerrarSuspensao();
    conferirAoRetomar();
  };
  const limite = setTimeout(retomar, temScrollend ? RETOMAR_COM_SCROLLEND_MS : RETOMAR_SEM_SCROLLEND_MS);
  if (temScrollend) window.addEventListener("scrollend", retomar, { once: true });
  encerrarSuspensao = () => {
    clearTimeout(limite);
    window.removeEventListener("scrollend", retomar);
    encerrarSuspensao = () => {};
  };
}

/** Encerra a suspensão (desligar a navegação não pode deixar a atualização passiva presa). */
function retomarAtualizacaoPassiva(): void {
  encerrarSuspensao();
  suspensa = false;
}

/** Seção que cruza a faixa do meio da viewport; no fim da página, a última (o id de agendar fica no rodapé). */
function secaoDominante(): string | undefined {
  const presentes = SECOES.filter((slug) => document.getElementById(slug));
  const noFim = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  if (noFim) return presentes[presentes.length - 1];
  const faixa = window.innerHeight * FAIXA;
  return presentes.find((slug) => {
    const { top, bottom } = document.getElementById(slug)!.getBoundingClientRect();
    return top <= faixa && bottom > faixa;
  });
}

/**
 * Leva o foco ao título da seção (ou à própria seção, sem título), sem rolar de novo, para quem usa
 * teclado ou leitor de tela acompanhar a navegação explícita.
 */
function focarTitulo(slug: string): void {
  const secao = document.getElementById(slug);
  const alvo = secao?.querySelector<HTMLElement>("h1, h2, h3") ?? secao;
  if (!alvo) return;
  if (!alvo.hasAttribute("tabindex")) alvo.tabIndex = -1;
  alvo.focus({ preventScroll: true });
}

/** Navegação explícita: suspende a atualização passiva, rola até a seção e leva o foco ao título. */
function navegarExplicitamente(slug: string, suave: boolean): boolean {
  suspenderAtualizacaoPassiva();
  if (!irParaSecao(slug, { suave })) return false;
  focarTitulo(slug);
  return true;
}

/** Carga em /<slug> (sitelink): rola até a seção sem animação. Só no navegador, depois da hidratação. */
export function rolarParaSecaoDaUrl(): void {
  const slug = secaoDaUrl(window.location.pathname);
  if (slug) navegarExplicitamente(slug, false);
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
    navegarExplicitamente(slug, true);
    atualizarUrl(slug);
  }

  // Caminho que a página conhece (carga e cada troca por lp:secao). Uma navegação só de âncora
  // (location.hash, Navigation API no mesmo caminho) também dispara popstate, mas não troca o caminho:
  // rolar até a seção do caminho aí faria a página pular sozinha (achado 4 do Tracking).
  let caminhoConhecido = window.location.pathname;
  function aoTrocarSecao(evento: Event) {
    caminhoConhecido = (evento as CustomEvent<DetalheSecao>).detail.caminho;
  }

  function aoNavegarNoHistorico() {
    if (window.location.pathname === caminhoConhecido) return;
    caminhoConhecido = window.location.pathname;
    const slug = secaoDaUrl(window.location.pathname) ?? "inicio";
    anunciarSecao(slug, window.location.pathname);
    if (!navegarExplicitamente(slug, false)) window.scrollTo({ top: 0, behavior: "instant" });
  }

  document.addEventListener("click", aoClicar);
  window.addEventListener("popstate", aoNavegarNoHistorico);
  window.addEventListener(EVENTO_SECAO, aoTrocarSecao);
  return () => {
    document.removeEventListener("click", aoClicar);
    window.removeEventListener("popstate", aoNavegarNoHistorico);
    window.removeEventListener(EVENTO_SECAO, aoTrocarSecao);
    retomarAtualizacaoPassiva();
  };
}

/**
 * A rolagem arma uma troca de URL (no máximo uma a cada 300 ms); no momento de aplicar, confirma de
 * novo a seção dominante e troca para /<slug> com replaceState, sem empilhar histórico.
 */
export function acompanharRolagem(): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  let espera: ReturnType<typeof setTimeout> | undefined;

  const aplicar = () => {
    espera = undefined;
    if (suspensa) return;
    const dominante = secaoDominante();
    if (dominante) atualizarUrl(dominante, { substituir: true });
  };
  cancelarTrocaPendente = () => {
    if (espera !== undefined) clearTimeout(espera);
    espera = undefined;
  };
  conferirAoRetomar = () => {
    if (espera === undefined) espera = setTimeout(aplicar, INTERVALO_URL_MS);
  };

  const observador = new IntersectionObserver(
    (entradas) => {
      if (suspensa || !entradas.some((entrada) => entrada.isIntersecting)) return;
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
    cancelarTrocaPendente();
    cancelarTrocaPendente = () => {};
    conferirAoRetomar = () => {};
    retomarAtualizacaoPassiva();
  };
}

/** Liga a navegação por seções. Devolve a função que desliga (efeito do React). */
export function iniciarNavegacaoPorSecoes(): () => void {
  const desligarRolagem = acompanharRolagem();
  const desligarLinks = interceptarLinksDeSecao();
  rolarParaSecaoDaUrl();
  return () => {
    desligarLinks();
    desligarRolagem();
  };
}
