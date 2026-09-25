import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Secao } from "@/components/Secao";
import { Icone } from "@/components/icones/Icone";
import { TEXTOS_IDENTIFICACAO as T } from "@/content/identificacao";
import { Autoavaliacao } from "@/interativos/Autoavaliacao";

export function S3Identificacao() {
  const classeCta = "inline-flex min-h-12 w-full items-center justify-center rounded bg-cta px-5 py-3 text-center text-lg font-semibold text-white sm:w-auto";
  return (
    <Secao id="para-quem" tituloId="titulo-para-quem" fundo="creme">
      <h2 id="titulo-para-quem">{T.titulo}</h2>
      <p className="mt-4 max-w-3xl">{T.intro}</p>
      <div className="mt-10 grid items-stretch gap-5 md:grid-cols-3">
        {T.grupos.map((grupo, indice) => (
          <article key={grupo.rotulo} className="premium-card identificacao-cartao flex h-full flex-col">
            <div className="identificacao-cartao__artes mb-6">
              <span className="identificacao-cartao__icone inline-flex h-14 w-14 items-center justify-center bg-creme">
                <Icone nome={(["joelho", "coluna", "tendaoTreino"] as const)[indice]} className="h-9 w-9 text-eco" />
              </span>
              <img src={`/prancha-${(["joelho", "coluna", "ombro"] as const)[indice]}.webp`} alt="" aria-hidden="true" width="400" height="400" loading="lazy" decoding="async" className="identificacao-cartao__arte" />
            </div>
            <h3>{grupo.rotulo}</h3>
            <ul className="mt-5 flex-1 list-disc space-y-3 pl-5">
              {grupo.exemplos.map((exemplo) => <li key={exemplo}>{exemplo}</li>)}
            </ul>
          </article>
        ))}
      </div>
      <p className="mt-8 max-w-3xl">{T.fechamento}</p>
      <CtaWhatsApp localCta="identificacao" className={`${classeCta} premium-cta mt-5`}>{T.cta}</CtaWhatsApp>
      <div className="autoavaliacao mx-auto mt-14 max-w-4xl">
        <Autoavaliacao />
      </div>
      <CtaWhatsApp localCta="identificacao" className={`${classeCta} premium-cta mt-8`}>{T.cta}</CtaWhatsApp>
    </Secao>
  );
}
