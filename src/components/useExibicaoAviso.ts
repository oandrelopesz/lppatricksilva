import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { lerConsentimento } from "@/lib/consentimento";

/**
 * Quando mostrar o aviso de cookies sem cobrir o CTA do hero (spec §5.10, pareceres R31 e R33).
 * Separado do visual do AvisoCookies. Regra reativa, enquanto não há escolha:
 * - a barra pode cobrir o CTA se, com a página no topo, o fim do CTA passa do início da faixa da barra
 *   (rolando, o CTA atravessa essa faixa). Se não pode, a barra aparece e fica;
 * - se pode, ela só aparece enquanto o CTA do hero está acima da viewport, e some de novo quando a
 *   pessoa volta ao hero;
 * - a decisão é refeita quando a viewport ou o layout mudam (resize, orientationchange, resize do
 *   visualViewport, agrupados por requestAnimationFrame) e a cada abertura;
 * - carga direta numa seção (CTA já acima da viewport) mostra na hora;
 * - o botão do rodapé abre na hora e mantém até a escolha, mesmo em cima do hero.
 * A altura real da barra é medida com ela invisível; nada aparece antes da primeira medição.
 */
export interface ExibicaoAviso {
  refBarra: RefObject<HTMLDivElement>;
  /** Renderizar a barra (visível ou não): há escolha pendente ou a pessoa pediu pelo rodapé. */
  montar: boolean;
  /** Barra visível agora. Oculta, ela fica inerte na hora (sem toque nem foco). */
  visivel: boolean;
  /** true até a primeira medição: a barra fica invisível e sem transição. */
  medindo: boolean;
  /** Depois de aceitar ou recusar. */
  concluir: () => void;
}

function ctaDoHero(): HTMLElement | null {
  return document.getElementById("cta-hero");
}

export function useExibicaoAviso(): ExibicaoAviso {
  const refBarra = useRef<HTMLDivElement>(null);
  const [pendente, setPendente] = useState(false);
  const [pedidoPeloRodape, setPedidoPeloRodape] = useState(false);
  /** null até medir; depois, se a barra pode cobrir o CTA do hero ao rolar. */
  const [podeCobrir, setPodeCobrir] = useState<boolean | null>(null);
  const [ctaAcima, setCtaAcima] = useState(false);

  // Só no cliente, depois da hidratação (o primeiro render continua vazio, igual ao servidor).
  useEffect(() => {
    setPendente(lerConsentimento() === null);
    const abrir = () => setPedidoPeloRodape(true);
    window.addEventListener("abrir-preferencias-cookies", abrir);
    return () => window.removeEventListener("abrir-preferencias-cookies", abrir);
  }, []);

  const montar = pendente || pedidoPeloRodape;

  /** Mede a altura real da barra (mesmo invisível) e a posição do CTA com a página no topo. */
  const medir = useCallback(() => {
    const altura = refBarra.current?.offsetHeight ?? 0;
    const cta = ctaDoHero();
    if (!cta) {
      setPodeCobrir(false);
      return;
    }
    const { bottom } = cta.getBoundingClientRect();
    setCtaAcima(bottom <= 0);
    setPodeCobrir(bottom + window.scrollY > window.innerHeight - altura);
  }, []);

  // A cada abertura (carga com escolha pendente ou botão do rodapé), mede de novo.
  useEffect(() => {
    if (montar && podeCobrir === null) medir();
  }, [montar, podeCobrir, medir]);

  // Viewport ou layout mudaram (redimensionar, girar, teclado virtual): refaz a decisão, uma vez por quadro.
  useEffect(() => {
    if (!montar) return;
    const agendarQuadro = window.requestAnimationFrame ?? ((f: FrameRequestCallback) => window.setTimeout(() => f(0), 16));
    const cancelarQuadro = window.cancelAnimationFrame ?? window.clearTimeout;
    let quadro: number | undefined;
    // Flag, e não o id do quadro: o callback pode rodar antes de o id ser atribuído.
    let agendado = false;
    const agendar = () => {
      if (agendado) return;
      agendado = true;
      quadro = agendarQuadro(() => {
        agendado = false;
        quadro = undefined;
        medir();
      });
    };
    const viewportVisual = window.visualViewport;
    window.addEventListener("resize", agendar);
    window.addEventListener("orientationchange", agendar);
    viewportVisual?.addEventListener("resize", agendar);
    return () => {
      window.removeEventListener("resize", agendar);
      window.removeEventListener("orientationchange", agendar);
      viewportVisual?.removeEventListener("resize", agendar);
      if (quadro !== undefined) cancelarQuadro(quadro);
    };
  }, [montar, medir]);

  // Reage à rolagem (o CTA passou para cima da viewport, ou voltou) só enquanto a escolha está pendente
  // e a barra pode cobrir o CTA; desconecta ao escolher. Aberta pelo rodapé, ela fica até a escolha.
  const observar = pendente && !pedidoPeloRodape && podeCobrir === true;
  useEffect(() => {
    if (!observar) return;
    const cta = ctaDoHero();
    if (!cta) return;
    if (typeof IntersectionObserver === "undefined") {
      const conferir = () => setCtaAcima(cta.getBoundingClientRect().bottom <= 0);
      window.addEventListener("scroll", conferir, { passive: true });
      return () => window.removeEventListener("scroll", conferir);
    }
    const observador = new IntersectionObserver((entradas) => {
      const entrada = entradas[entradas.length - 1];
      setCtaAcima(!entrada.isIntersecting && entrada.boundingClientRect.bottom <= 0);
    });
    observador.observe(cta);
    return () => observador.disconnect();
  }, [observar]);

  const concluir = useCallback(() => {
    setPendente(false);
    setPedidoPeloRodape(false);
    // A próxima abertura (rodapé) mede de novo, com a viewport de então.
    setPodeCobrir(null);
  }, []);

  const medindo = montar && podeCobrir === null;
  const visivel = montar && (pedidoPeloRodape || (podeCobrir !== null && (!podeCobrir || ctaAcima)));
  return { refBarra, montar, visivel, medindo, concluir };
}
