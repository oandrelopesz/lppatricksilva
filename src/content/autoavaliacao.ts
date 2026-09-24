export interface Etapa {
  chave: "regiao" | "limitacao" | "tentativa";
  pergunta: string;
  opcoes: string[];
}

const REGIOES: Record<string, string> = {
  Joelho: "dor no joelho",
  Quadril: "dor no quadril",
  Ombro: "dor no ombro",
  "Coluna lombar": "dor na coluna lombar",
  Pescoço: "dor no pescoço",
  "Pé e calcanhar": "dor no pé ou no calcanhar",
  Cotovelo: "dor no cotovelo",
};
const LIMITACOES: Record<string, string> = {
  "Subir escada": "já atrapalha subir escada",
  "Dormir a noite inteira": "já atrapalha dormir a noite inteira",
  "Trabalhar sem parar": "já atrapalha trabalhar sem parar",
  Dirigir: "já atrapalha dirigir",
  "Treinar ou jogar": "já atrapalha treinar ou jogar",
  "Ajoelhar ou agachar": "já atrapalha ajoelhar ou agachar",
  "Pegar o neto ou o filho no colo": "já atrapalha pegar o neto ou o filho no colo",
};
const TENTATIVAS: Record<string, string> = {
  Remédio: "já tentei remédio",
  Fisioterapia: "já fiz fisioterapia",
  "Infiltração com corticoide": "já fiz infiltração com corticoide",
  "Disseram que é da idade": "já me disseram que é da idade",
  "Falaram em cirurgia": "já me falaram em cirurgia",
  "Nada ainda": "ainda não tentei nada",
};

export const TEXTOS_AUTOAVALIACAO: {
  titulo: string;
  introducao: string;
  etapas: Etapa[];
  progresso: (atual: number, total: number) => string;
  pular: string;
  voltar: string;
  refazer: string;
  tituloResultado: string;
  respostaAnterior: (resposta: string) => string;
  resumo: {
    inicio: string;
    regiao: (valor: string) => string;
    limitacao: (valor: string) => string;
    tentativa: (valor: string) => string;
    semRespostas: string;
  };
  oQueAConsultaAvalia: string;
  aviso: string;
  incluirResumo: string;
  avisoPrivacidade: string;
  cta: string;
} = {
  titulo: "Quer montar um resumo da sua dor em 3 toques?",
  introducao: "É opcional e leva menos de um minuto. Serve para você chegar na conversa com tudo organizado. Pode pular qualquer pergunta.",
  etapas: [
    { chave: "regiao", pergunta: "Onde dói?", opcoes: Object.keys(REGIOES) },
    { chave: "limitacao", pergunta: "O que essa dor já atrapalha?", opcoes: Object.keys(LIMITACOES) },
    { chave: "tentativa", pergunta: "O que você já tentou?", opcoes: Object.keys(TENTATIVAS) },
  ],
  progresso: (atual, total) => `Etapa ${atual} de ${total}`,
  pular: "Pular",
  voltar: "Voltar",
  refazer: "Refazer",
  tituloResultado: "Seu resumo",
  respostaAnterior: (resposta) => `Sua resposta: ${resposta}`,
  resumo: {
    inicio: "Meu resumo:",
    regiao: (valor) => REGIOES[valor],
    limitacao: (valor) => LIMITACOES[valor],
    tentativa: (valor) => TENTATIVAS[valor],
    semRespostas: "Você preferiu não responder. Tudo bem: a conversa começa na consulta.",
  },
  oQueAConsultaAvalia: "Na consulta, o médico ouve como a dor começou e o que já foi tentado, examina a região que dói e lê os exames que você levar. A partir daí, explica o que cabe no seu caso e o que não cabe.",
  aviso: "Este resumo serve para organizar a conversa. Não é diagnóstico e não substitui a avaliação na consulta.",
  incluirResumo: "Incluir meu resumo na mensagem do WhatsApp",
  avisoPrivacidade: "Suas respostas ficam nesta página até você marcar esta opção e clicar no botão. Aí o texto vai para o WhatsApp só para preencher a mensagem. O consultório só recebe se você enviar.",
  cta: "Chamar no WhatsApp para agendar",
};
