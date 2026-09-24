import type { MouseEvent } from "react";
import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { Foto } from "@/components/Foto";
import { ASSINATURA } from "@/config";
import { TEXTOS_RODAPE as T } from "@/content/rodape";
import { REGIOES, cidadesDaRegiao } from "@/data/locais";

/**
 * Abre a aba da cidade com a mesma ação do clique na aba (contexto com fonte "aba", evento e mapa
 * liberado por ação real) e leva o foco a ela. Sem JavaScript, o href #aba-... continua levando à aba.
 */
function abrirAba(evento: MouseEvent<HTMLAnchorElement>, cidadeId: string) {
  // Clique com modificador ou outro botão: o navegador segue o href (nova aba, janela etc.).
  if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
  const aba = document.getElementById(`aba-${cidadeId}`);
  if (!aba) return;
  evento.preventDefault();
  aba.click();
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  aba.scrollIntoView?.({ behavior: reduzir ? "auto" : "smooth", block: "center" });
  aba.focus({ preventScroll: true });
}

export function S8Rodape() {
  return (
    <footer id="rodape" className="bg-grafite px-4 py-16 text-creme">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">{T.ctaTitulo}</h2>
          <p className="mt-3">{T.ctaTexto}</p>
          <CtaWhatsApp
            localCta="rodape"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-cta px-5 py-3 text-center font-semibold text-white sm:w-auto"
          >
            {T.ctaBotao}
          </CtaWhatsApp>
          <p className="mt-8 text-dourado-claro">{ASSINATURA}</p>
          <p className="mt-3">{T.particular}</p>
          <p className="mt-3">{T.whatsapp}</p>
        </div>
        <figure className="mx-auto w-full max-w-sm">
          <Foto nome="cta-final" alt={T.altFoto} sizes="(min-width: 768px) 384px, 100vw" className="aspect-[4/5] h-auto w-full rounded-2xl object-cover" />
        </figure>
        <div className="md:col-span-2">
          <h3 className="text-xl font-semibold">{T.cidadesRotulo}</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {REGIOES.map((regiao) => (
              <div key={regiao.id}>
                <h4 className="font-semibold">{regiao.nome}</h4>
                <ul className="mt-2 space-y-1">
                  {cidadesDaRegiao(regiao.id).map((cidade) => (
                    <li key={cidade.id}>
                      <a className="underline underline-offset-4" href={`#aba-${cidade.id}`} onClick={(e) => abrirAba(e, cidade.id)}>
                        {cidade.nome}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8">{T.avisoMedico}</p>
          <p className="mt-3">{T.lgpd}</p>
          <a className="mt-3 inline-block min-h-12 py-2 font-semibold underline underline-offset-4" href="/politica-de-privacidade.html">{T.politicaLink}</a>
          <div id="rodape-extra"></div>
          <p className="mt-4">{T.copyright(new Date().getFullYear())}</p>
        </div>
      </div>
    </footer>
  );
}
