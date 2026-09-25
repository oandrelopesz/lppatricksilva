import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(process.cwd(), "public/politica-de-privacidade.html"), "utf8");

describe("política de privacidade", () => {
  it("inclui as 11 seções da minuta, retorno à LP e nenhuma fonte editorial ou placeholder visível", () => {
    expect(html).toContain("<!-- Minuta para revisão jurídica -->");
    expect(html).toContain('href="/"');
    expect((html.match(/<h2\b/g) || [])).toHaveLength(11);
    expect(html).toContain("O controlador dos dados é o Dr. Patrick Santos");
    expect(html).not.toMatch(/\[fonte:|\[PREENCHER\]|\{data da publicação\}/);
  });

  describe("versão de 25/09/2026 (textos-lgpd, seção F; parecer R36)", () => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const texto = doc.body.textContent!.replace(/\s+/g, " ");

    it("tem a data logo abaixo da assinatura", () => {
      expect(doc.querySelector(".assinatura")!.nextElementSibling!.textContent).toBe("Última atualização: 25 de setembro de 2026.");
    });

    it("não fala mais em código de referência na mensagem, só que ela vai sem ele", () => {
      expect(texto).not.toMatch(/Um código de referência|termina com um código/);
      expect(texto).toContain("abre uma conversa no seu WhatsApp com uma mensagem pronta, sem código de referência.");
    });

    it("descreve os sinais sem cookies, as duas opções, o resumo com autorização, o gclid e a Vercel", () => {
      for (const trecho of [
        "Esses sinais não são anônimos",
        "Em Escolher, você liga ou desliga, uma por uma, a Medição de visitas pelo Google Analytics e a Medição de anúncios pelo Google Ads.",
        "Resumo da dor: o seu consentimento específico, dado ao marcar a opção (LGPD, art. 11, I).",
        "Outros parâmetros do endereço são apagados antes de as ferramentas do Google carregarem.",
        "Se não aceitou, cada cidade mostra o botão Ver mapa",
        "A página é hospedada pela Vercel",
        "Google, Meta e Vercel têm sede no exterior",
        "Dados técnicos de hospedagem na Vercel e dados do Google Ads: seguem os prazos definidos por esses serviços.",
        "Pedir a portabilidade dos dados, quando couber.",
        "Para exercer seus direitos ou falar sobre privacidade, envie mensagem ao Dr. Patrick Santos pelo WhatsApp (13) 99682-2680. A resposta completa vem em até 15 dias.",
        "A página é servida por conexão segura (HTTPS), hospedada pela Vercel, e não tem banco de dados nem formulário.",
        "Fora esses casos, os dados só são compartilhados por obrigação legal ou ordem de autoridade.",
      ]) {
        expect(texto).toContain(trecho);
      }
      expect(texto).not.toContain("Clínica parceira.");
      expect(texto).not.toContain("Ela lida com três tipos de dado.");
      expect(texto).not.toContain("—");
    });
  });
});
