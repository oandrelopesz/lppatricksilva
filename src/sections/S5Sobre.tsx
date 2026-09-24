import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Foto } from "@/components/Foto";
import { Secao } from "@/components/Secao";
import { ASSINATURA } from "@/config";
import { TEXTOS_SOBRE as T } from "@/content/sobre";

export function S5Sobre() {
  return (
    <Secao id="sobre" tituloId="titulo-sobre" fundo="grafite">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <figure className="mx-auto w-full max-w-md">
          <Foto nome="sobre" alt={T.altFoto} sizes="(min-width: 768px) 480px, 100vw" className="premium-photo aspect-[4/5] h-auto w-full object-cover" />
        </figure>
        <div>
          <h2 id="titulo-sobre" className="text-3xl font-semibold sm:text-4xl">{T.titulo}</h2>
          <p className="mt-3 text-dourado-claro">{ASSINATURA}</p>
          {T.paragrafos.map((texto) => <p key={texto} className="mt-5">{texto}</p>)}
          <CtaWhatsApp
            localCta="sobre"
            className="premium-cta mt-7 inline-flex min-h-12 w-full items-center justify-center bg-cta px-5 py-3 text-center font-semibold text-white sm:w-auto"
          >
            {T.cta}
          </CtaWhatsApp>
        </div>
      </div>
    </Secao>
  );
}
