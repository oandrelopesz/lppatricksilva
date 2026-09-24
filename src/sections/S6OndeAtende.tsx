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
      <CtaWhatsApp localCta="onde_atende" intencao="duvida">
        {T.rodapeCta}
      </CtaWhatsApp>
    </section>
  );
}
