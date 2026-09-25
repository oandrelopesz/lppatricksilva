import { useEffect, useRef, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";
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
  /** Esperando a conversão sair antes de navegar: link ocupado, com aparência de pressionado. */
  const [aguardando, setAguardando] = useState(false);
  /** Trava síncrona: do clique que navega por código até a navegação, outro clique simples é ignorado. */
  const navegando = useRef(false);

  /** Registra o clique e navega pela regra do clique (analytics.track), com o link ocupado na espera. */
  function registrarENavegar(url: string, params: Parameters<typeof track>[1], inicioMs?: number, gtmProntoNoClique?: boolean) {
    navegando.current = true;
    setAguardando(true);
    track("clique_whatsapp", params, {
      inicioMs,
      gtmProntoNoClique,
      aoConcluir: () => {
        navegando.current = false;
        setAguardando(false);
        navegacao.ir(url);
      },
    });
  }
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
    const novaAba = evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.button !== 0;
    // Com resumo, o navegador abriria o link base: todo clique navega por código com a URL completa.
    if (novaAba && !resumo) {
      track("clique_whatsapp", preparar(evento.currentTarget).params);
      return;
    }
    evento.preventDefault();
    if (navegando.current) return;
    const { url, params } = preparar(evento.currentTarget);
    registrarENavegar(url, params);
  }

  /**
   * Botão do meio dispara auxclick, não click: o navegador abre a nova aba e aqui só registra.
   * Com resumo, a nova aba abre o link base (spec §20, R5).
   */
  // Clique segurado antes da hidratação (script inline do index.html): segue o caminho normal, com o
  // teto de navegação contado do clique original. O efeito sem dependências usa sempre as props atuais.
  useEffect(() => {
    const elemento = refLink.current;
    if (!elemento) return;
    const aoSegurado = (evento: Event) => {
      evento.preventDefault();
      if (navegando.current) return;
      const { url, params } = preparar(elemento);
      const { t, gtmPronto } = (evento as CustomEvent<{ t: number; gtmPronto?: boolean }>).detail;
      registrarENavegar(url, params, t, gtmPronto);
    };
    elemento.addEventListener("lp:clique-segurado", aoSegurado);
    return () => elemento.removeEventListener("lp:clique-segurado", aoSegurado);
  });

  function aoClicarAuxiliar(evento: MouseEvent<HTMLAnchorElement>) {
    if (evento.button !== 1) return;
    track("clique_whatsapp", preparar(evento.currentTarget).params);
  }

  return (
    <a
      ref={refLink}
      href={linkBase}
      onClick={aoClicar}
      onAuxClick={aoClicarAuxiliar}
      data-local-cta={localCta}
      {...resto}
      className={[resto.className, aguardando ? "cta-aguardando" : ""].filter(Boolean).join(" ") || undefined}
      aria-busy={aguardando || undefined}
    >
      {children}
    </a>
  );
}
