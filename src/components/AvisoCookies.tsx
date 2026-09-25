import { useExibicaoAviso } from "@/components/useExibicaoAviso";
import { TEXTOS_COOKIES as T } from "@/content/cookies";
import { aplicarConsentimento, salvarConsentimento, type Escolha } from "@/lib/consentimento";

const BOTAO =
  "inline-flex h-12 min-h-12 flex-1 items-center justify-center rounded-full border border-creme px-3 py-2 text-base font-semibold sm:flex-none sm:px-5 sm:py-3";

export function AvisoCookies() {
  // Quando mostrar (sem cobrir o CTA do hero) fica no hook, separado do visual.
  const { refBarra, montar, visivel, medindo, concluir } = useExibicaoAviso();

  function escolher(escolha: Escolha) {
    salvarConsentimento(escolha);
    aplicarConsentimento(escolha);
    concluir();
  }

  if (!montar) return null;
  return (
    <div
      ref={refBarra}
      role="region"
      aria-label={T.rotulo}
      aria-hidden={!visivel || undefined}
      data-oculto={!visivel || undefined}
      data-medindo={medindo || undefined}
      className="aviso-cookies fixed inset-x-0 bottom-0 z-50 border-t border-dourado bg-grafite px-3 py-[7px] text-creme shadow-lg sm:px-4 sm:py-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <p tabIndex={0} className="aviso-cookies__texto max-h-[60px] overflow-y-auto pr-2 text-base leading-5 sm:max-h-none sm:overflow-visible sm:pr-0 sm:leading-snug">{T.texto}</p>
          <a href="/politica-de-privacidade.html" className="inline-flex min-h-12 items-center font-semibold text-dourado-claro underline underline-offset-2 sm:min-h-0">
            {T.linkPolitica}
          </a>
        </div>
        {/* Mesmo peso visual para as duas escolhas. */}
        <div className="flex gap-2 sm:gap-3">
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
