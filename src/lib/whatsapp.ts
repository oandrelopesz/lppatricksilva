import { WHATSAPP_NUMERO } from "@/config";
import { MENSAGENS_WHATSAPP } from "@/content/whatsapp";

export type IntencaoWhatsApp = "agendar" | "duvida";

export interface PedidoWhatsApp {
  /** "duvida" nos CTAs "Perguntar no WhatsApp" (wa.duvida). Padrão: "agendar". */
  intencao?: IntencaoWhatsApp;
  /** Nome da cidade escolhida pelo usuário (nunca presumida). */
  cidade?: string;
  /** Nome do local, no CTA de um cartão de local. */
  local?: string;
  /** Resumo da autoavaliação, só quando o usuário marcou a caixa de inclusão. */
  resumo?: string;
  ref: string;
}

function textoDuvida(p: PedidoWhatsApp): string {
  return p.cidade ? MENSAGENS_WHATSAPP.duvidaComCidade(p.cidade) : MENSAGENS_WHATSAPP.duvida;
}

export function montarMensagem(p: PedidoWhatsApp): string {
  const texto =
    p.intencao === "duvida"
      ? textoDuvida(p)
      : p.cidade && p.local
        ? MENSAGENS_WHATSAPP.comLocal(p.cidade, p.local)
        : p.cidade
          ? MENSAGENS_WHATSAPP.comCidade(p.cidade)
          : MENSAGENS_WHATSAPP.base;
  // Com resumo clínico, a mensagem não leva a ref: a origem do clique não fica ligada às respostas.
  if (p.resumo) return `${texto} ${p.resumo.trim()}`;
  return p.ref ? `${texto} (ref ${p.ref})` : texto;
}

function link(texto: string): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
}

export function montarLinkWhatsApp(p: PedidoWhatsApp): string {
  return link(montarMensagem(p));
}

/** Link do HTML pré-renderizado: funciona sem JavaScript. */
export const LINK_WHATSAPP_BASE = link(MENSAGENS_WHATSAPP.base);

/** Link do HTML pré-renderizado dos CTAs de dúvida. */
export const LINK_WHATSAPP_DUVIDA = link(MENSAGENS_WHATSAPP.duvida);
