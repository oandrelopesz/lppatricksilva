import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Foto } from "@/components/Foto";
import { ASSINATURA } from "@/config";
import { TEXTOS_HERO as T } from "@/content/hero";

export function S2Hero() {
  return (
    <header className="bg-creme px-4 pb-12 pt-5 text-grafite md:py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className="min-w-0">
          <p className="mb-3 inline-block rounded-full border border-grafite/20 bg-bege px-3 py-1 text-base font-semibold leading-snug">
            {T.badge}
          </p>
          <h1 className="max-w-xl text-[clamp(1.9rem,5vw,3.5rem)] font-bold leading-[1.12] tracking-tight">
            {T.headline}
          </h1>
          <p className="mt-3 max-w-xl text-lg leading-snug">{T.subheadline}</p>
          <p className="mt-3 max-w-xl text-lg leading-snug">
            {T.linhaCidades}{" "}
            <a className="font-semibold underline underline-offset-4" href="#onde-atende">{T.linkOndeAtende}</a>
          </p>
          <CtaWhatsApp
            id="cta-hero"
            localCta="hero"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-cta px-5 py-3 text-center text-base font-semibold leading-snug text-white hover:bg-cta-escuro sm:w-auto"
          >
            {T.cta}
          </CtaWhatsApp>
          <p className="mt-4 max-w-xl text-lg leading-snug">{ASSINATURA}</p>
        </div>
        <div className="mx-auto w-full max-w-[30rem] overflow-hidden rounded-2xl">
          <Foto
            nome="hero"
            alt={T.altFoto}
            sizes="(min-width: 768px) 480px, 100vw"
            prioridade
            className="aspect-[4/5] h-auto w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
