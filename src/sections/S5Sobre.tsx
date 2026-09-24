import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Foto } from "@/components/Foto";
import { Secao } from "@/components/Secao";
import { ASSINATURA } from "@/config";
import { TEXTOS_SOBRE as T } from "@/content/sobre";

export function S5Sobre() {
  return (
    <Secao id="sobre" tituloId="titulo-sobre" fundo="grafite">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="sobre-imagens mx-auto w-full max-w-md">
          <figure>
            <Foto nome="sobre" alt={T.altFoto} sizes="(min-width: 768px) 480px, 100vw" className="premium-photo aspect-[4/5] h-auto w-full object-cover" />
          </figure>
          <img src="/ilustracao-joelho.svg" alt="" aria-hidden="true" width="150" height="150" className="sobre-ilustracao" />
        </div>
        <div>
          <h2 id="titulo-sobre" className="text-3xl font-semibold sm:text-4xl">{T.titulo}</h2>
          <p className="mt-3 text-dourado-claro">{ASSINATURA}</p>
          <ul className="sobre-fatos mt-7">
            {T.paragrafos.map((texto) => <li key={texto}><p>{texto}</p></li>)}
          </ul>
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
