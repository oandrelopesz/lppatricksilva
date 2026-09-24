export const MENSAGENS_WHATSAPP = {
  base: "Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular. Minha cidade: (escreva aqui).",
  comCidade: (cidade: string) => `Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular em ${cidade}.`,
  comLocal: (cidade: string, local: string) =>
    `Olá! Vim pelo site do Dr. Patrick Santos e quero agendar uma consulta particular em ${cidade}. Local: ${local}.`,
};
