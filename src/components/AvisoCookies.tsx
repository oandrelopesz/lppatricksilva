import { useEffect, useRef, useState } from "react";
import { TEXTOS_COOKIES as T } from "@/content/cookies";
import { aplicarConsentimento, lerConsentimento, salvarConsentimento, type Escolha } from "@/lib/consentimento";

const BOTAO =
  "inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-creme px-5 py-3 text-base font-semibold sm:flex-none";

/**
 * fechado: sem aviso; medindo: renderizado invisível só para medir a altura da barra; esperando: a
 * barra cobriria o CTA do hero e aguarda ele sair da tela; aberto: visível.
 */
type Fase = "fechado" | "medindo" | "esperando" | "aberto";

/**
 * A barra, com esta altura no rodapé da tela, cobriria o CTA do hero na tela? (spec §5.10) O CTA conta
 * como na tela quando o centro dele está visível: se só aponta na borda (desktop a 1440x900, 6 px), o
 * aviso aparece na carga.
 */
function cobreOCtaDoHero(alturaBarra: number): boolean {
  const cta = document.getElementById("cta-hero");
  if (!cta) return false;
  const { top, bottom } = cta.getBoundingClientRect();
  const centro = (top + bottom) / 2;
  const naTela = centro > 0 && centro < window.innerHeight;
  return naTela && bottom > window.innerHeight - alturaBarra;
}

export function AvisoCookies() {
  const [fase, setFase] = useState<Fase>("fechado");
  const barra = useRef<HTMLDivElement>(null);

  // Só no cliente, depois da hidratação: sem escolha, mede antes de mostrar. O rodapé reabre na hora.
  useEffect(() => {
    if (lerConsentimento() === null) setFase("medindo");
    const reabrir = () => setFase("aberto");
    window.addEventListener("abrir-preferencias-cookies", reabrir);
    return () => window.removeEventListener("abrir-preferencias-cookies", reabrir);
  }, []);

  // Decide pela geometria real: a altura da barra contra a posição do CTA do hero. A barra está invisível
  // enquanto mede, então um efeito comum basta (useLayoutEffect avisaria no render do servidor).
  useEffect(() => {
    if (fase !== "medindo") return;
    setFase(cobreOCtaDoHero(barra.current?.offsetHeight ?? 0) ? "esperando" : "aberto");
  }, [fase]);

  // Cobriria o CTA: aparece quando o CTA do hero sai da tela.
  useEffect(() => {
    if (fase !== "esperando") return;
    const cta = document.getElementById("cta-hero");
    if (!cta) {
      setFase("aberto");
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      const conferir = () => {
        const { top, bottom } = cta.getBoundingClientRect();
        if (bottom <= 0 || top >= window.innerHeight) setFase("aberto");
      };
      window.addEventListener("scroll", conferir, { passive: true });
      return () => window.removeEventListener("scroll", conferir);
    }
    const observador = new IntersectionObserver((entradas) => {
      if (entradas.some((entrada) => !entrada.isIntersecting)) setFase("aberto");
    });
    observador.observe(cta);
    return () => observador.disconnect();
  }, [fase]);

  function escolher(escolha: Escolha) {
    salvarConsentimento(escolha);
    aplicarConsentimento(escolha);
    setFase("fechado");
  }

  if (fase === "fechado" || fase === "esperando") return null;
  const medindo = fase === "medindo";
  return (
    <div
      ref={barra}
      role="region"
      aria-label={T.rotulo}
      aria-hidden={medindo || undefined}
      style={medindo ? { visibility: "hidden" } : undefined}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-dourado bg-grafite px-4 py-4 text-creme shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <p className="text-base leading-snug">
          {T.texto}{" "}
          <a href="/politica-de-privacidade.html" className="font-semibold text-dourado-claro underline underline-offset-2">
            {T.linkPolitica}
          </a>
        </p>
        {/* Mesmo peso visual para as duas escolhas. */}
        <div className="flex gap-3">
          <button type="button" onClick={() => escolher("recusado")} className={BOTAO}>
            {T.recusar}
          </button>
          <button type="button" onClick={() => escolher("aceito")} className={`${BOTAO} bg-creme text-grafite`}>
            {T.aceitar}
          </button>
        </div>
      </div>
    </div>
  );
}
