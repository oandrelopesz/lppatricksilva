export const MENSAGENS_WHATSAPP = {
  base: "Olá! Vim do site e gostaria de agendar uma consulta.",
  comCidade: (cidade: string) => `Olá! Vim do site e gostaria de agendar uma consulta em ${cidade}.`,
  comLocal: (cidade: string, local: string) =>
    `Olá! Vim do site e gostaria de agendar uma consulta em ${cidade} (${local}).`,
  /** wa.duvida: CTAs "Perguntar no WhatsApp". */
  duvida: "Olá! Vim do site e gostaria de tirar uma dúvida antes de agendar uma consulta.",
  /** wa.duvida com a cidade escolhida, no mesmo padrão de wa.cidade. */
  duvidaComCidade: (cidade: string) =>
    `Olá! Vim do site e gostaria de tirar uma dúvida antes de agendar uma consulta em ${cidade}.`,
};
