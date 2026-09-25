import { AbasCidades } from "@/components/AbasCidades";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";

export function S6OndeAtende() {
  return (
    <section id="onde-atende" aria-labelledby="onde-atende-titulo">
      <h2 id="onde-atende-titulo">{T.titulo}</h2>
      <p>{T.intro}</p>
      <AbasCidades />
      <p>{T.rodape}</p>
      {/* Quem não achou a cidade pergunta sem a cidade aberta antes (parecer R11). */}
      <CtaWhatsApp localCta="onde_atende" intencao="duvida" ignorarCidade className="premium-cta mt-6 inline-flex min-h-12 items-center justify-center bg-cta px-6 py-3 text-center font-semibold text-white">
        {T.rodapeCta}
      </CtaWhatsApp>
    </section>
  );
}
