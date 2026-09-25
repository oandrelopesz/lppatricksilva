/** Dados do médico e da página. Só fatos das fontes da spec (§2). */
export const MEDICO = {
  nome: "Dr. Patrick Santos",
  profissao: "MÉDICO",
  especialidade: "Ortopedia e Traumatologia",
  crmUf: "MA",
  crmNumero: "16520",
  rqeNumero: "7389",
} as const;

export const ASSINATURA = `${MEDICO.nome} · ${MEDICO.profissao} · CRM-${MEDICO.crmUf} ${MEDICO.crmNumero} · ${MEDICO.especialidade} · RQE ${MEDICO.rqeNumero}`;

export const WHATSAPP_NUMERO = "5513996822680";
export const WHATSAPP_EXIBICAO = "(13) 99682-2680";

/**
 * Domínio principal (aprovado pelo André em 25/09/2026). www e lp-dr-santos.vercel.app redirecionam para
 * ele com 301, configurados no painel da Vercel (Settings > Domains), não no vercel.json.
 */
export const SITE_URL = "https://drpatricksantos.com.br";

export const GTM_ID: string = import.meta.env.VITE_GTM_ID ?? "";

/** ID da conversão do Google Ads (público: vai no próprio request da conversão). */
export const ADS_ID_CONVERSAO = "18460652540";

/**
 * Pendências da spec §17. null = a página não mostra o dado e orienta a perguntar no WhatsApp.
 * Nunca exibir placeholder ao público.
 */
export const PENDENCIAS: {
  valorConsulta: string | null;
  formasPagamento: string | null;
  duracaoConsulta: string | null;
  regraRetorno: string | null;
  graduacao: string | null;
  residencia: string | null;
  anosExperiencia: string | null;
} = {
  valorConsulta: null,
  formasPagamento: null,
  duracaoConsulta: null,
  regraRetorno: null,
  graduacao: null,
  residencia: null,
  anosExperiencia: null,
};
