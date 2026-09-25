import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Foto } from "@/components/Foto";
import { Secao } from "@/components/Secao";
import { Icone } from "@/components/icones/Icone";
import { SeletorCidade } from "@/components/SeletorCidade";
import { TEXTOS_COMO_FUNCIONA as T } from "@/content/comoFunciona";

export function S4ComoFunciona() {
  return (
    <Secao id="como-funciona" tituloId="titulo-como-funciona">
      <h2 id="titulo-como-funciona">{T.titulo}</h2>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <ol className="premium-timeline space-y-5 pl-14">
          {T.passos.map((passo, indice) => (
            <li key={passo.titulo} className="premium-card relative p-5 md:p-7">
              <span className="timeline-marker" aria-hidden="true">{indice + 1}</span>
              <div className="flex items-center gap-4">
                <Icone nome={(["conversa", "calendario", "joelho", "ultrassom", "mapa", "conversa"] as const)[indice]} className="h-9 w-9 shrink-0 text-eco" />
                <h3 className="text-xl font-semibold">{passo.titulo}</h3>
              </div>
              <p className="mt-2">{passo.texto}</p>
              {indice === 0 ? <div className="mt-4"><SeletorCidade /></div> : null}
            </li>
          ))}
        </ol>
        <figure className="mx-auto w-full max-w-md self-start lg:sticky lg:top-28">
          <Foto nome="consulta" alt={T.altFoto} sizes="(min-width: 1024px) 352px, 100vw" className="premium-photo aspect-[4/5] h-auto w-full object-cover" />
          <figcaption className="mt-2">{T.legendaFoto}</figcaption>
        </figure>
      </div>
      <CtaWhatsApp
        localCta="como_funciona"
        className="premium-cta mt-8 inline-flex min-h-12 w-full items-center justify-center bg-cta px-5 py-3 text-center font-semibold text-white sm:w-auto"
      >
        {T.cta}
      </CtaWhatsApp>
    </Secao>
  );
}
