import { AbasCidades } from "@/components/AbasCidades";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";

export function S6OndeAtende() {
  return (
    <section id="onde-atende" aria-labelledby="onde-atende-titulo">
      <h2 id="onde-atende-titulo">{T.titulo}</h2>
      <p>{T.introducao}</p>
      <AbasCidades />
    </section>
  );
}
