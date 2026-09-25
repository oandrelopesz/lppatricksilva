import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Foto } from "@/components/Foto";
import { Icone } from "@/components/icones/Icone";
import { ASSINATURA } from "@/config";
import { TEXTOS_HERO as T } from "@/content/hero";

export function S2Hero() {
  return (
    <header className="atlas-hero bg-creme px-4 pb-16 pt-8 text-grafite md:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-16 gap-y-6 md:grid-cols-2 md:items-center">
        <div className="min-w-0">
          <p className="mb-5 inline-block rounded-full border border-dourado/50 bg-bege px-4 py-2 text-sm font-semibold leading-snug tracking-wide">
            {T.badge}
          </p>
          <h1 className="max-w-xl font-semibold">
            {T.headline}
          </h1>
          <p className="mt-5 max-w-xl leading-normal">{T.subheadline}</p>
          <p className="mt-4 flex max-w-xl items-start gap-2 leading-snug">
            <Icone nome="mapa" className="mt-0.5 h-5 w-5 shrink-0 text-eco" />
            <span>
            {T.linhaCidades}{" "}
            <a className="inline-flex min-h-12 items-center font-semibold underline underline-offset-4" href="#onde-atende">{T.linkOndeAtende}</a>
            </span>
          </p>
          <CtaWhatsApp
            id="cta-hero"
            localCta="hero"
            className="premium-cta mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-cta px-6 py-3 text-center text-base font-semibold leading-snug text-white sm:w-auto"
          >
            <Icone nome="conversa" className="h-5 w-5 shrink-0" />
            {T.cta}
          </CtaWhatsApp>
          <p className="mt-5 max-w-xl border-t border-dourado/40 pt-4 text-[18px] leading-snug text-grafite">{ASSINATURA}</p>
        </div>
        <figure className="hero-media mx-auto w-full max-w-[31rem] md:col-start-2 md:row-start-1">
          <Foto
            nome="hero"
            alt={T.altFoto}
            sizes="(min-width: 768px) 480px, 100vw"
            prioridade
            className="premium-photo aspect-[4/5] h-auto w-full object-cover"
          />
        </figure>
      </div>
    </header>
  );
}
