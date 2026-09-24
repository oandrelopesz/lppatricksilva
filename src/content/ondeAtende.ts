// PROVISORIO: trocar pelo texto aprovado da nota copy-lp (IDs onde.*) na Tarefa 7.
export const TEXTOS_ONDE_ATENDE = {
  titulo: "Onde ele atende",
  introducao: "São 14 clínicas e hospitais parceiros em 11 cidades do Maranhão. Escolha sua cidade para ver endereço, mapa e como agendar.",
  semCidade: "Escolha sua cidade acima para ver o mapa e agendar.",
  verTodas: "Ver todas as cidades",
  verMapa: "Ver mapa",
  comoChegar: "Como chegar",
  agendarEm: (cidade: string) => `Agendar em ${cidade}`,
  tituloMapa: (local: string) => `Mapa: ${local}`,
};
