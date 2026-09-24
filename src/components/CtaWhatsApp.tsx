import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useCidade } from "@/context/CidadeContext";
import { track } from "@/lib/analytics";
import { obterOrigem } from "@/lib/origem";
import { LINK_WHATSAPP_BASE, LINK_WHATSAPP_DUVIDA, montarLinkWhatsApp, type IntencaoWhatsApp } from "@/lib/whatsapp";

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
  /** "duvida" nos CTAs "Perguntar no WhatsApp" (wa.duvida). Padrão: "agendar". */
  intencao?: IntencaoWhatsApp;
}

/** Navegação isolada para os testes trocarem. */
export const navegacao = {
  ir(url: string) {
    window.location.assign(url);
  },
};

export function CtaWhatsApp({ localCta, cidadeFixa, local, resumo, intencao = "agendar", children, ...resto }: Props) {
  const { cidade } = useCidade();

  /**
   * Monta a URL completa e os parâmetros do evento. Sem resumo, grava a URL no href do elemento.
   * Com resumo, o href fica no link base: a resposta de saúde nunca vai para o DOM, onde a medição
   * de cliques de saída ou um acionador do GTM poderia ler a URL (spec §20, R5).
   */
  function preparar(elemento: HTMLAnchorElement) {
    const origem = obterOrigem();
    const nomeCidade = cidadeFixa ?? cidade?.nome;
    const url = montarLinkWhatsApp({ intencao, cidade: nomeCidade, local, resumo, ref: origem.ref });
    if (!resumo) elemento.href = url;
    const params = {
      local_cta: localCta,
      intencao,
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
    // Com resumo, o navegador abriria o link base: todo clique navega por código com a URL completa.
    if (novaAba && !resumo) {
      track("clique_whatsapp", params);
      return;
    }
    evento.preventDefault();
    track("clique_whatsapp", params, { aoConcluir: () => navegacao.ir(url) });
  }

  /**
   * Botão do meio dispara auxclick, não click: o navegador abre a nova aba e aqui só registra.
   * Com resumo, a nova aba abre o link base (spec §20, R5).
   */
  function aoClicarAuxiliar(evento: MouseEvent<HTMLAnchorElement>) {
    if (evento.button !== 1) return;
    track("clique_whatsapp", preparar(evento.currentTarget).params);
  }

  return (
    <a href={intencao === "duvida" ? LINK_WHATSAPP_DUVIDA : LINK_WHATSAPP_BASE} onClick={aoClicar} onAuxClick={aoClicarAuxiliar} {...resto}>
      {children}
    </a>
  );
}
