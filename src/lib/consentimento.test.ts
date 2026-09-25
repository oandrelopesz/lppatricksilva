import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHAVE_CONSENTIMENTO,
  VERSAO_CONSENTIMENTO,
  aceitouAlguma,
  aplicarConsentimento,
  lerConsentimento,
  salvarConsentimento,
  sinaisDoConsentimento,
} from "./consentimento";

function ultimoUpdate() {
  const ultimo = Array.from(window.dataLayer!.at(-1) as unknown as ArrayLike<unknown>);
  expect(ultimo.slice(0, 2)).toEqual(["consent", "update"]);
  return ultimo[2];
}

describe("consentimento por categoria", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
  });

  it("começa sem escolha", () => {
    expect(lerConsentimento()).toBeNull();
  });

  it("guarda visitas, anúncios, versão e data (ISO) e lê de volta", () => {
    salvarConsentimento({ visitas: true, anuncios: false }, new Date("2026-09-25T12:00:00.000Z"));
    expect(JSON.parse(localStorage.getItem(CHAVE_CONSENTIMENTO)!)).toEqual({
      visitas: true,
      anuncios: false,
      versao: VERSAO_CONSENTIMENTO,
      data: "2026-09-25T12:00:00.000Z",
    });
    expect(VERSAO_CONSENTIMENTO).toBe("2026-09-25");
    expect(lerConsentimento()).toEqual({ visitas: true, anuncios: false });
  });

  it("ignora registro inválido", () => {
    localStorage.setItem(CHAVE_CONSENTIMENTO, "talvez");
    expect(lerConsentimento()).toBeNull();
    localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify({ visitas: "sim", anuncios: false }));
    expect(lerConsentimento()).toBeNull();
  });

  it("storage bloqueado não quebra a leitura nem a gravação", () => {
    const ler = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    const gravar = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(lerConsentimento()).toBeNull();
    expect(() => salvarConsentimento({ visitas: true, anuncios: true })).not.toThrow();
    ler.mockRestore();
    gravar.mockRestore();
  });

  describe("migração da escolha antiga (lp_consentimento_v1)", () => {
    it("aceito liga as duas", () => {
      localStorage.setItem("lp_consentimento_v1", "aceito");
      expect(lerConsentimento()).toEqual({ visitas: true, anuncios: true });
      expect(JSON.parse(localStorage.getItem(CHAVE_CONSENTIMENTO)!)).toMatchObject({ visitas: true, anuncios: true, versao: VERSAO_CONSENTIMENTO });
      expect(localStorage.getItem("lp_consentimento_v1")).toBeNull();
    });

    it("recusado desliga as duas", () => {
      localStorage.setItem("lp_consentimento_v1", "recusado");
      expect(lerConsentimento()).toEqual({ visitas: false, anuncios: false });
      expect(localStorage.getItem("lp_consentimento_v1")).toBeNull();
    });

    it("valor antigo desconhecido não vira escolha", () => {
      localStorage.setItem("lp_consentimento_v1", "talvez");
      expect(lerConsentimento()).toBeNull();
    });
  });

  describe("mapeamento das 4 combinações para o Consent Mode", () => {
    const casos = [
      [{ visitas: false, anuncios: false }, { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }],
      [{ visitas: true, anuncios: false }, { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }],
      [{ visitas: false, anuncios: true }, { analytics_storage: "denied", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" }],
      [{ visitas: true, anuncios: true }, { analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" }],
    ] as const;

    for (const [escolha, sinais] of casos) {
      it(`visitas ${escolha.visitas ? "ligada" : "desligada"}, anúncios ${escolha.anuncios ? "ligada" : "desligada"}`, () => {
        expect(sinaisDoConsentimento(escolha)).toEqual(sinais);
        aplicarConsentimento(escolha);
        expect(ultimoUpdate()).toEqual(sinais);
      });
    }
  });

  it("aceitouAlguma: pelo menos uma categoria ligada", () => {
    expect(aceitouAlguma(null)).toBe(false);
    expect(aceitouAlguma({ visitas: false, anuncios: false })).toBe(false);
    expect(aceitouAlguma({ visitas: true, anuncios: false })).toBe(true);
    expect(aceitouAlguma({ visitas: false, anuncios: true })).toBe(true);
  });
});
