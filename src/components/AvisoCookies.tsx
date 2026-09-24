import { useEffect, useState } from "react";
import { TEXTOS_COOKIES as T } from "@/content/cookies";
import { aplicarConsentimento, lerConsentimento, salvarConsentimento, type Escolha } from "@/lib/consentimento";

const BOTAO =
  "inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-creme px-5 py-3 text-base font-semibold sm:flex-none";

export function AvisoCookies() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    setAberto(lerConsentimento() === null);
    const reabrir = () => setAberto(true);
    window.addEventListener("abrir-preferencias-cookies", reabrir);
    return () => window.removeEventListener("abrir-preferencias-cookies", reabrir);
  }, []);

  function escolher(escolha: Escolha) {
    salvarConsentimento(escolha);
    aplicarConsentimento(escolha);
    setAberto(false);
  }

  if (!aberto) return null;
  return (
    <div
      role="region"
      aria-label={T.rotulo}
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
