import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Foto } from "@/components/Foto";
import { Secao } from "@/components/Secao";
import { ASSINATURA } from "@/config";
import { TEXTOS_SOBRE as T } from "@/content/sobre";

export function S5Sobre() {
  return (
    <Secao id="sobre" tituloId="titulo-sobre" fundo="bege">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="sobre-imagens mx-auto w-full max-w-md">
          <figure>
            <Foto nome="sobre" alt={T.altFoto} sizes="(min-width: 768px) 480px, 100vw" className="premium-photo aspect-[4/5] h-auto w-full object-cover" />
          </figure>
        </div>
        <div>
          <h2 id="titulo-sobre">{T.titulo}</h2>
          <p className="mt-3 text-grafite">{ASSINATURA}</p>
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
