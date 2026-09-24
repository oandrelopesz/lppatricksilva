import { Accordion } from "@/components/Accordion";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Secao } from "@/components/Secao";
import { TEXTOS_FAQ as T } from "@/content/faq";

export function S7Faq() {
  return (
    <Secao id="duvidas" tituloId="titulo-duvidas">
      <h2 id="titulo-duvidas" className="text-3xl font-semibold sm:text-4xl">{T.titulo}</h2>
      <p className="mt-4">{T.intro}</p>
      <div className="mt-8"><Accordion itens={[...T.itens]} /></div>
      <div className="faq-fecho premium-card mt-10 bg-bege p-6 md:p-8">
        <h3 className="text-2xl font-semibold">{T.finalTitulo}</h3>
        <p className="mt-2">{T.finalTexto}</p>
        <CtaWhatsApp
          localCta="faq"
          intencao="duvida"
          className="premium-cta mt-5 inline-flex min-h-12 w-full items-center justify-center bg-cta px-5 py-3 text-center font-semibold text-white sm:w-auto"
        >
          {T.finalCta}
        </CtaWhatsApp>
      </div>
    </Secao>
  );
}
