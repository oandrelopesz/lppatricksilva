import { CtaWhatsApp } from "@/components/CtaWhatsApp";
import { TEXTOS_ONDE_ATENDE as T } from "@/content/ondeAtende";
import { urlEmbedMapa, type Cidade, type Local } from "@/data/locais";
import { track } from "@/lib/analytics";

interface Props {
  cidade: Cidade;
  local: Local;
  /** true no painel aberto, quando a seção se aproxima da viewport. */
  mostrarMapa: boolean;
}

export function CartaoLocal({ cidade, local, mostrarMapa }: Props) {
  return (
    <article className="cartao-local" aria-labelledby={`local-${local.id}`}>
      <h4 id={`local-${local.id}`}>{local.nome}</h4>
      <p>
        <span>{T.clinica.enderecoRotulo}</span> {local.endereco}
      </p>
      {local.diasAtendimento ? (
        <p>
          <span>{T.clinica.diasRotulo}</span> {local.diasAtendimento}
        </p>
      ) : null}
      <p>{T.clinica.disponibilidade}</p>
      <div className="cartao-local__mapa">
        {mostrarMapa ? (
          <iframe
            src={urlEmbedMapa(local)}
            title={T.clinica.mapaTitulo(local.nome)}
            loading="lazy"
            referrerPolicy="no-referrer"
            width="100%"
            height="240"
          />
        ) : null}
      </div>
      <a
        href={local.linkComoChegar}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("como_chegar", { local: local.nome, cidade: cidade.nome })}
      >
        {T.clinica.comoChegar}
      </a>
      <CtaWhatsApp localCta="onde_atende" cidadeFixa={cidade.nome} local={local.nome}>
        {T.clinica.ctaCurto(cidade.nome)}
      </CtaWhatsApp>
    </article>
  );
}
