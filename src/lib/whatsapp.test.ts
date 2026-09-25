import { describe, expect, it } from "vitest";
import { MENSAGENS_WHATSAPP } from "@/content/whatsapp";
import { LINK_WHATSAPP_BASE, LINK_WHATSAPP_DUVIDA, montarLinkWhatsApp, montarMensagem, type PedidoWhatsApp } from "./whatsapp";

/** Código de referência que não pode aparecer (pedido do André, spec §21 "Sem código de referência"). */
const SEM_REF = [/\(ref /, /ref [A-Z0-9]{6}/];

const textoDe = (url: string) => new URL(url).searchParams.get("text")!;

describe("whatsapp", () => {
  it("usa exatamente as mensagens aprovadas na copy", () => {
    expect(MENSAGENS_WHATSAPP.base).toBe("Olá! Vim do site e gostaria de agendar uma consulta.");
    expect(MENSAGENS_WHATSAPP.comCidade("Balsas")).toBe("Olá! Vim do site e gostaria de agendar uma consulta em Balsas.");
    expect(MENSAGENS_WHATSAPP.comLocal("Balsas", "Hospital São José")).toBe(
      "Olá! Vim do site e gostaria de agendar uma consulta em Balsas (Hospital São José).",
    );
    expect(MENSAGENS_WHATSAPP.duvida).toBe("Olá! Vim do site e gostaria de tirar uma dúvida antes de agendar uma consulta.");
  });

  it("o link base aponta para o número único", () => {
    expect(LINK_WHATSAPP_BASE.startsWith("https://wa.me/5513996822680?text=")).toBe(true);
  });

  describe("cada variante é exatamente o texto da copy, sem sufixo", () => {
    const casos: Array<[string, PedidoWhatsApp, string]> = [
      ["base", {}, MENSAGENS_WHATSAPP.base],
      ["com cidade", { cidade: "Tuntum" }, MENSAGENS_WHATSAPP.comCidade("Tuntum")],
      ["com local", { cidade: "Balsas", local: "Hospital São José" }, MENSAGENS_WHATSAPP.comLocal("Balsas", "Hospital São José")],
      ["dúvida", { intencao: "duvida" }, MENSAGENS_WHATSAPP.duvida],
      ["dúvida com cidade", { intencao: "duvida", cidade: "Tuntum" }, MENSAGENS_WHATSAPP.duvidaComCidade("Tuntum")],
      ["com resumo", { resumo: "Marquei no site: joelho." }, `${MENSAGENS_WHATSAPP.base} Marquei no site: joelho.`],
      [
        "com cidade e resumo",
        { cidade: "Tuntum", resumo: "Marquei no site: joelho." },
        `${MENSAGENS_WHATSAPP.comCidade("Tuntum")} Marquei no site: joelho.`,
      ],
    ];

    it.each(casos)("%s", (_nome, pedido, esperado) => {
      expect(montarMensagem(pedido)).toBe(esperado);
      expect(textoDe(montarLinkWhatsApp(pedido))).toBe(esperado);
    });

    it("nenhuma mensagem nem link tem código de referência", () => {
      const textos = casos.flatMap(([, pedido]) => [montarMensagem(pedido), montarLinkWhatsApp(pedido), textoDe(montarLinkWhatsApp(pedido))]);
      textos.push(LINK_WHATSAPP_BASE, LINK_WHATSAPP_DUVIDA, textoDe(LINK_WHATSAPP_BASE), textoDe(LINK_WHATSAPP_DUVIDA));
      for (const texto of textos) for (const padrao of SEM_REF) expect(texto).not.toMatch(padrao);
    });
  });

  it("codifica a mensagem na URL", () => {
    const url = montarLinkWhatsApp({ cidade: "São Domingos do Azeitão" });
    expect(url).not.toContain(" ");
    expect(textoDe(url)).toContain("São Domingos do Azeitão");
  });

  it("sem intenção, o padrão continua agendar", () => {
    expect(montarMensagem({ cidade: "Tuntum" })).toBe(montarMensagem({ intencao: "agendar", cidade: "Tuntum" }));
  });

  it("o link base de dúvida usa wa.duvida", () => {
    expect(textoDe(LINK_WHATSAPP_DUVIDA)).toBe(MENSAGENS_WHATSAPP.duvida);
  });
});
