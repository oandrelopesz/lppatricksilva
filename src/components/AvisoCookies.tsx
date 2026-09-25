import { useEffect, useId, useRef, useState } from "react";
import { useExibicaoAviso } from "@/components/useExibicaoAviso";
import { TEXTOS_COOKIES as T } from "@/content/cookies";
import { aplicarConsentimento, lerConsentimento, salvarConsentimento, type Escolha } from "@/lib/consentimento";
import { apagarCookiesRevogados } from "@/lib/cookiesMedicao";

const BOTAO =
  "inline-flex h-12 min-h-12 flex-1 items-center justify-center rounded border border-creme px-3 py-2 text-base font-semibold sm:flex-none sm:px-5 sm:py-3";

const NENHUMA: Escolha = { visitas: false, anuncios: false };
const TODAS: Escolha = { visitas: true, anuncios: true };

export function AvisoCookies() {
  // Quando mostrar (sem cobrir o CTA do hero) fica no hook, separado do visual.
  const { refBarra, montar, visivel, medindo, escolhendo, abrirEscolha, concluir } = useExibicaoAviso();
  /** Chaves da segunda camada: a escolha atual, ou as duas desligadas. */
  const [rascunho, setRascunho] = useState<Escolha>(NENHUMA);
  const id = useId();
  const refConteudo = useRef<HTMLDivElement>(null);
  /** Escolher some ao abrir a segunda camada: o foco passa para a área dela, não se perde. */
  const focarConteudo = useRef(false);

  useEffect(() => {
    if (escolhendo) setRascunho(lerConsentimento() ?? NENHUMA);
  }, [escolhendo]);

  useEffect(() => {
    if (!escolhendo || !focarConteudo.current) return;
    focarConteudo.current = false;
    refConteudo.current?.focus();
  }, [escolhendo]);

  function escolher(escolha: Escolha) {
    salvarConsentimento(escolha);
    aplicarConsentimento(escolha);
    apagarCookiesRevogados(escolha);
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
      data-escolhendo={escolhendo || undefined}
      // Oculta, a barra fica inerte no mesmo render: sem toque nem foco durante a saída (parecer R33).
      {...(visivel ? {} : { inert: "" })}
      className="aviso-cookies fixed inset-x-0 bottom-0 z-50 border-t border-dourado bg-grafite px-3 py-[7px] text-creme shadow-lg sm:px-4 sm:py-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
        {/* Na segunda camada, título, texto e chaves rolam aqui dentro e os botões ficam fixos no pé
            (parecer R38); a área é focável para rolar pelo teclado. A primeira camada não rola. */}
        <div
          ref={refConteudo}
          className="aviso-cookies__conteudo min-w-0 flex-1"
          {...(escolhendo ? { role: "group", "aria-labelledby": `${id}-titulo`, tabIndex: 0 } : {})}
        >
          {escolhendo ? (
            <>
              <p id={`${id}-titulo`} className="aviso-cookies__titulo text-base font-semibold">{T.titulo}</p>
              {(
                [
                  ["visitas", T.opcaoVisitas, T.opcaoVisitasDescricao],
                  ["anuncios", T.opcaoAnuncios, T.opcaoAnunciosDescricao],
                ] as const
              ).map(([chave, rotulo, descricao]) => (
                <label key={chave} className="aviso-cookies__opcao mt-1 flex min-h-12 items-center gap-3">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={rascunho[chave]}
                    onChange={(e) => setRascunho((atual) => ({ ...atual, [chave]: e.target.checked }))}
                    aria-labelledby={`${id}-${chave}-rotulo`}
                    aria-describedby={`${id}-${chave}`}
                    className="aviso-cookies__chave shrink-0"
                  />
                  <span>
                    <span id={`${id}-${chave}-rotulo`} className="block font-semibold">{rotulo}</span>
                    <span id={`${id}-${chave}`} className="block text-base">{descricao}</span>
                  </span>
                </label>
              ))}
              {/* Aceitar qualquer opção também carrega os mapas: dito junto das chaves (parecer R37, B2). */}
              <p className="mt-1 text-base">{T.notaMapas}</p>
              <p className="mt-1 text-base">{T.notaPersonalizacao}</p>
            </>
          ) : (
            /* Texto inteiro, sem rolagem interna (parecer R32): a barra fica mais alta no celular, e o
               useExibicaoAviso mede essa altura real para não cobrir o CTA do hero. */
            <p className="aviso-cookies__texto text-base leading-5 sm:leading-snug">{T.texto}</p>
          )}
          <a href="/politica-de-privacidade.html" className="inline-flex min-h-12 items-center font-semibold text-dourado-claro underline underline-offset-2 sm:min-h-0">
            {T.linkPolitica}
          </a>
        </div>
        {/* Recusar tudo com o mesmo peso visual de Aceitar tudo. */}
        <div className="aviso-cookies__acoes flex flex-wrap gap-2 sm:gap-3">
          <button type="button" onClick={() => escolher(NENHUMA)} className={`${BOTAO} bg-creme text-grafite`}>
            {T.recusarTudo}
          </button>
          {escolhendo ? (
            <button type="button" onClick={() => escolher(rascunho)} className={BOTAO}>
              {T.salvar}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                focarConteudo.current = true;
                abrirEscolha();
              }}
              className={BOTAO}
            >
              {T.escolher}
            </button>
          )}
          <button type="button" onClick={() => escolher(TODAS)} className={`${BOTAO} bg-creme text-grafite`}>
            {T.aceitarTudo}
          </button>
        </div>
      </div>
    </div>
  );
}
