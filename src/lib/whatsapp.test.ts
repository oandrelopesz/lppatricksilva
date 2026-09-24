import { describe, expect, it } from "vitest";
import { MENSAGENS_WHATSAPP } from "@/content/whatsapp";
import { LINK_WHATSAPP_BASE, montarLinkWhatsApp, montarMensagem } from "./whatsapp";

describe("whatsapp", () => {
  it("usa exatamente as mensagens aprovadas na copy C1e", () => {
    expect(MENSAGENS_WHATSAPP.base).toBe("Olá! Vim do site e gostaria de agendar uma consulta.");
    expect(MENSAGENS_WHATSAPP.comCidade("Balsas")).toBe(
      "Olá! Vim do site e gostaria de agendar uma consulta em Balsas.",
    );
    expect(MENSAGENS_WHATSAPP.comLocal("Balsas", "Hospital São José")).toBe(
      "Olá! Vim do site e gostaria de agendar uma consulta em Balsas (Hospital São José).",
    );
  });

  it("o link base aponta para o número único", () => {
    expect(LINK_WHATSAPP_BASE.startsWith("https://wa.me/5513996822680?text=")).toBe(true);
  });

  it("sem cidade usa a mensagem base e termina com a ref", () => {
    const m = montarMensagem({ ref: "ABC234" });
    expect(m.startsWith(MENSAGENS_WHATSAPP.base)).toBe(true);
    expect(m.endsWith("(ref ABC234)")).toBe(true);
  });

  it("com cidade usa a mensagem da cidade", () => {
    expect(montarMensagem({ cidade: "Tuntum", ref: "ABC234" })).toBe(`${MENSAGENS_WHATSAPP.comCidade("Tuntum")} (ref ABC234)`);
  });

  it("com local usa cidade e local", () => {
    expect(montarMensagem({ cidade: "Balsas", local: "Hospital São José", ref: "ABC234" })).toBe(
      `${MENSAGENS_WHATSAPP.comLocal("Balsas", "Hospital São José")} (ref ABC234)`,
    );
  });

  it("com resumo, inclui o resumo e não leva a ref", () => {
    const m = montarMensagem({ resumo: "Marquei no site: joelho.", ref: "ABC234" });
    expect(m).toContain("Marquei no site: joelho.");
    expect(m).not.toContain("ABC234");
  });

  it("codifica a mensagem na URL", () => {
    const url = montarLinkWhatsApp({ cidade: "São Domingos do Azeitão", ref: "ABC234" });
    expect(url).not.toContain(" ");
    expect(new URL(url).searchParams.get("text")).toContain("São Domingos do Azeitão");
  });
});
