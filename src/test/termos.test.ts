import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const caminho = resolve(process.cwd(), "public/termos-de-uso.html");
const politica = readFileSync(resolve(process.cwd(), "public/politica-de-privacidade.html"), "utf8");

/** Títulos e textos da nota termos-de-uso (Maestro, 25/09/2026). */
const SECOES: Array<[string, string]> = [
  ["1. Sobre esta página", "Esta página apresenta o atendimento particular do Dr. Patrick Santos, ortopedista, nas cidades do Maranhão onde ele atende, e permite começar uma conversa pelo WhatsApp para agendar uma consulta. Estes termos explicam o uso desta página."],
  ["2. Conteúdo informativo", "As informações desta página têm caráter educativo e não substituem a consulta médica. A autoavaliação da dor serve só para organizar a conversa: não é diagnóstico, não indica tratamento e não substitui a avaliação na consulta. Em caso de urgência, procure um serviço de emergência."],
  ["3. Agendamento", "O agendamento é feito pelo WhatsApp (13) 99682-2680, com o próprio Dr. Patrick Santos. O atendimento é exclusivamente particular: não atende plano de saúde nem SUS. A disponibilidade de datas e horários é combinada na conversa."],
  ["4. Locais de atendimento", "Os endereços e os mapas das clínicas e dos hospitais servem para orientar. Os mapas são do Google Maps e podem mudar sem aviso. Confirme o local na conversa antes de ir."],
  ["5. Uso adequado", "Não use a página para fins ilegais, para enviar conteúdo ofensivo ou para tentar atrapalhar o funcionamento dela."],
  ["6. Direitos sobre o conteúdo", "Para reutilizar textos, fotos ou ilustrações desta página, respeite os direitos de seus titulares e os usos permitidos por lei."],
  ["7. Serviços de terceiros", "A página usa serviços de outras empresas, como WhatsApp, Google Maps, Google Analytics e Google Ads, que seguem os próprios termos. O tratamento dos seus dados está descrito na Política de privacidade."],
  ["8. Alterações", "Estes termos podem ser atualizados. A data da última atualização fica no topo desta página."],
  ["9. Lei aplicável", "Estes termos seguem as leis do Brasil, inclusive o Código de Defesa do Consumidor."],
  ["10. Contato", "Para dúvidas sobre estes termos, envie mensagem pelo WhatsApp (13) 99682-2680."],
];

describe("termos de uso (public/termos-de-uso.html)", () => {
  it("existe", () => {
    expect(existsSync(caminho)).toBe(true);
  });

  const html = existsSync(caminho) ? readFileSync(caminho, "utf8") : "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const limpo = (texto: string | null | undefined) => (texto ?? "").replace(/\s+/g, " ").trim();

  it("título, Voltar, assinatura e a data logo abaixo dela", () => {
    expect(doc.title).toBe("Termos de uso");
    expect(limpo(doc.querySelector("h1")?.textContent)).toBe("Termos de uso");
    const voltar = doc.querySelector("a.voltar")!;
    expect(voltar.getAttribute("href")).toBe("/");
    expect(limpo(voltar.textContent)).toBe("Voltar para a página de agendamento");
    const assinatura = doc.querySelector(".assinatura")!;
    expect(limpo(assinatura.textContent)).toBe("Página de agendamento do Dr. Patrick Santos · MÉDICO · CRM-MA 16520 · Ortopedia e Traumatologia · RQE 7389");
    expect(limpo(assinatura.nextElementSibling?.textContent)).toBe("Última atualização: 25 de setembro de 2026.");
  });

  it("tem as seções 1 a 10 com os textos da nota, em ordem", () => {
    const secoes = [...doc.querySelectorAll("main section")];
    expect(secoes).toHaveLength(10);
    secoes.forEach((secao, i) => {
      expect(limpo(secao.querySelector("h2")?.textContent)).toBe(SECOES[i][0]);
      expect(limpo([...secao.querySelectorAll("p")].map((p) => p.textContent).join(" "))).toBe(SECOES[i][1]);
    });
    const link = doc.querySelector('section a[href="/politica-de-privacidade.html"]')!;
    expect(limpo(link.textContent)).toBe("Política de privacidade");
  });

  it("mesmo estilo da política: fontes, cores, foco visível e Voltar com 48 px", () => {
    const estilo = (h: string) => h.replace(/\r\n/g, "\n").match(/<style>([\s\S]*?)<\/style>/)![1];
    expect(estilo(html)).toBe(estilo(politica));
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain('name="viewport"');
  });

  it("sem travessão", () => {
    expect(doc.body.textContent).not.toContain("—");
  });
});
