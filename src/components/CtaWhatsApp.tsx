import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useCidade } from "@/context/CidadeContext";
import { track } from "@/lib/analytics";
import { obterOrigem } from "@/lib/origem";
import { LINK_WHATSAPP_BASE, montarLinkWhatsApp } from "@/lib/whatsapp";

export type LocalCta =
  | "topbar"
  | "hero"
  | "identificacao"
  | "autoavaliacao"
  | "como_funciona"
  | "sobre"
  | "onde_atende"
  | "faq"
  | "rodape"
  | "flutuante";

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick" | "target" | "rel"> {
  localCta: LocalCta;
  /** Cidade do cartão de local; tem prioridade sobre a cidade escolhida. */
  cidadeFixa?: string;
  /** Nome do local, no CTA de um cartão de local. */
  local?: string;
  /** Resumo da autoavaliação; só passe quando o usuário marcou a caixa de inclusão. */
  resumo?: string;
}

/** Navegação isolada para os testes trocarem. */
export const navegacao = {
  ir(url: string) {
    window.location.assign(url);
  },
};

export function CtaWhatsApp({ localCta, cidadeFixa, local, resumo, children, ...resto }: Props) {
  const { cidade } = useCidade();

  /** Monta o link completo no href do elemento e devolve a URL e os parâmetros do evento. */
  function preparar(elemento: HTMLAnchorElement) {
    const origem = obterOrigem();
    const nomeCidade = cidadeFixa ?? cidade?.nome;
    const url = montarLinkWhatsApp({ cidade: nomeCidade, local, resumo, ref: origem.ref });
    elemento.href = url;
    const params = {
      local_cta: localCta,
      cidade: nomeCidade,
      local,
      // Sem ref quando há resumo: a mensagem também não leva a ref (spec §7).
      ref: resumo ? undefined : origem.ref,
      gclid: origem.gclid,
      utm_source: origem.utm_source,
      utm_medium: origem.utm_medium,
      utm_campaign: origem.utm_campaign,
      utm_content: origem.utm_content,
    };
    return { url, params };
  }

  function aoClicar(evento: MouseEvent<HTMLAnchorElement>) {
    const { url, params } = preparar(evento.currentTarget);
    const novaAba = evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.button !== 0;
    if (novaAba) {
      track("clique_whatsapp", params);
      return;
    }
    evento.preventDefault();
    track("clique_whatsapp", params, { aoConcluir: () => navegacao.ir(url) });
  }

  /** Botão do meio dispara auxclick, não click: o navegador abre a nova aba e aqui só registra. */
  function aoClicarAuxiliar(evento: MouseEvent<HTMLAnchorElement>) {
    if (evento.button !== 1) return;
    track("clique_whatsapp", preparar(evento.currentTarget).params);
  }

  return (
    <a href={LINK_WHATSAPP_BASE} onClick={aoClicar} onAuxClick={aoClicarAuxiliar} {...resto}>
      {children}
    </a>
  );
}
