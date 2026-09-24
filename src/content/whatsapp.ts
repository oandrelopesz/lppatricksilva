export const MENSAGENS_WHATSAPP = {
  base: "Olá! Vim do site e gostaria de agendar uma consulta.",
  comCidade: (cidade: string) => `Olá! Vim do site e gostaria de agendar uma consulta em ${cidade}.`,
  comLocal: (cidade: string, local: string) =>
    `Olá! Vim do site e gostaria de agendar uma consulta em ${cidade} (${local}).`,
};
