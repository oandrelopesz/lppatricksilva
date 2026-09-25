/** Textos aprovados da nota copy-lp (C1e), IDs onde.*. Nomes, endereços e links vêm de data/locais.ts. */
export const TEXTOS_ONDE_ATENDE = {
  titulo: "Onde o Dr. Patrick atende",
  intro:
    "São 14 clínicas e hospitais parceiros em 11 cidades do Maranhão. Escolha a sua cidade para ver o endereço e o mapa. Pergunte pelo WhatsApp sobre a disponibilidade na sua cidade.",
  /** onde.dica_rolagem: só mobile (uso visual da Tarefa 7). */
  dicaRolagem: "Deslize para ver mais cidades",
  abasAria: "Cidades onde o Dr. Patrick atende",
  /** onde.ver_todas (C1f): botão que volta da cidade aberta para a lista de todas as cidades. */
  verTodas: "Ver todas as cidades",
  clinica: {
    enderecoRotulo: "Endereço",
    /** Só aparece quando o local tiver dias de atendimento cadastrados. */
    diasRotulo: "Dias de atendimento",
    disponibilidade: "Disponibilidade nesta cidade: pergunte pelo WhatsApp.",
    mapaTitulo: (clinica: string) => `Mapa: ${clinica}`,
    comoChegar: "Como chegar",
    cta: (cidade: string) => `Chamar no WhatsApp para agendar em ${cidade}`,
    /** onde.clinica.cta.curto: se o botão não couber em duas linhas. */
    ctaCurto: (cidade: string) => `Agendar em ${cidade}`,
  },
  /** Acima da lista, nas cidades com mais de um local (Balsas e Barra do Corda). */
  multiplas: (n: number) => `${n} locais nesta cidade. Escolha o mais perto de você.`,
  rodape: "Não achou a sua cidade? Mande mensagem mesmo assim e informe onde você mora.",
  rodapeCta: "Perguntar no WhatsApp",
};
