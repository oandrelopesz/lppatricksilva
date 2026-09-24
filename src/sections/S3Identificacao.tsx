import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Secao } from "@/components/Secao";
import { TEXTOS_IDENTIFICACAO as T } from "@/content/identificacao";
import { Autoavaliacao } from "@/interativos/Autoavaliacao";

export function S3Identificacao() {
  const classeCta = "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-cta px-5 py-3 text-center text-lg font-semibold text-white hover:bg-cta-escuro sm:w-auto";
  return (
    <Secao id="para-quem" tituloId="titulo-para-quem" fundo="bege">
      <h2 id="titulo-para-quem" className="text-3xl font-semibold sm:text-4xl">{T.titulo}</h2>
      <p className="mt-4 max-w-3xl">{T.intro}</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {T.grupos.map((grupo) => (
          <article key={grupo.rotulo} className="h-full rounded-2xl bg-creme p-5">
            <h3 className="text-xl font-semibold">{grupo.rotulo}</h3>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              {grupo.exemplos.map((exemplo) => <li key={exemplo}>{exemplo}</li>)}
            </ul>
          </article>
        ))}
      </div>
      <p className="mt-8 max-w-3xl">{T.fechamento}</p>
      <CtaWhatsApp localCta="identificacao" className={`${classeCta} mt-5`}>{T.cta}</CtaWhatsApp>
      <div className="mt-12">
        <Autoavaliacao />
      </div>
      <CtaWhatsApp localCta="identificacao" className={`${classeCta} mt-8`}>{T.cta}</CtaWhatsApp>
    </Secao>
  );
}
