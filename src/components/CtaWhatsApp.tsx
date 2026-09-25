import { useEffect, useRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
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
  | "rodape";

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
  /** Não usa a cidade escolhida (ex.: "Não achou a sua cidade?"); a seleção continua para os outros CTAs. */
  ignorarCidade?: boolean;
}

/** Navegação isolada para os testes trocarem. */
export const navegacao = {
  ir(url: string) {
    window.location.assign(url);
  },
};

export function CtaWhatsApp({
  localCta,
  cidadeFixa,
  local,
  resumo,
  intencao = "agendar",
  ignorarCidade = false,
  children,
  ...resto
}: Props) {
  const { cidade } = useCidade();
  const refLink = useRef<HTMLAnchorElement>(null);
  const linkBase = intencao === "duvida" ? LINK_WHATSAPP_DUVIDA : LINK_WHATSAPP_BASE;

  // Um clique anterior sem resumo gravou a URL completa no href, e o React não regrava o atributo
  // porque o valor virtual (linkBase) não mudou. Quando o resumo passa a existir, volta ao base (R10).
  useEffect(() => {
    if (resumo && refLink.current) refLink.current.href = linkBase;
  }, [resumo, linkBase]);

  /**
   * Monta a URL completa e os parâmetros do evento. Sem resumo, grava a URL no href do elemento.
   * Com resumo, o href volta ao link base: a resposta de saúde nunca vai para o DOM, onde a medição
   * de cliques de saída ou um acionador do GTM poderia ler a URL (spec §20, R5).
   */
  function preparar(elemento: HTMLAnchorElement) {
    const origem = obterOrigem();
    const nomeCidade = ignorarCidade ? undefined : (cidadeFixa ?? cidade?.nome);
    const url = montarLinkWhatsApp({ intencao, cidade: nomeCidade, local, resumo });
    elemento.href = resumo ? linkBase : url;
    const params = {
      local_cta: localCta,
      intencao,
      cidade: nomeCidade,
      local,
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
    <a ref={refLink} href={linkBase} onClick={aoClicar} onAuxClick={aoClicarAuxiliar} {...resto}>
      {children}
    </a>
  );
}
