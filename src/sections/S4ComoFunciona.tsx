import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Foto } from "@/components/Foto";
import { Secao } from "@/components/Secao";
import { SeletorCidade } from "@/components/SeletorCidade";
import { TEXTOS_COMO_FUNCIONA as T } from "@/content/comoFunciona";

export function S4ComoFunciona() {
  return (
    <Secao id="como-funciona" tituloId="titulo-como-funciona">
      <h2 id="titulo-como-funciona" className="text-3xl font-semibold sm:text-4xl">{T.titulo}</h2>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <ol className="space-y-5">
          {T.passos.map((passo, indice) => (
            <li key={passo.titulo} className="rounded-xl border border-grafite/15 p-5">
              <h3 className="text-xl font-semibold">{indice + 1}. {passo.titulo}</h3>
              <p className="mt-2">{passo.texto}</p>
              {indice === 0 ? <div className="mt-4"><SeletorCidade /></div> : null}
            </li>
          ))}
        </ol>
        <figure className="mx-auto w-full max-w-md">
          <Foto nome="consulta" alt={T.altFoto} sizes="(min-width: 1024px) 352px, 100vw" className="aspect-[4/5] h-auto w-full rounded-2xl object-cover" />
          <figcaption className="mt-2">{T.legendaFoto}</figcaption>
        </figure>
      </div>
      <CtaWhatsApp
        localCta="como_funciona"
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-cta px-5 py-3 text-center font-semibold text-white sm:w-auto"
      >
        {T.cta}
      </CtaWhatsApp>
    </Secao>
  );
}
