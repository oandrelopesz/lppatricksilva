// PROVISORIO: trocar pelo texto aprovado da nota copy-lp (IDs wa.*) na Tarefa 7.
export const MENSAGENS_WHATSAPP = {
  base: "Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular.",
  comCidade: (cidade: string) => `Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular em ${cidade}.`,
  comLocal: (cidade: string, local: string) =>
    `Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular em ${cidade} (${local}).`,
};
