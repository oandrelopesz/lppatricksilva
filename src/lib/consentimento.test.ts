import { beforeEach, describe, expect, it } from "vitest";
import { aplicarConsentimento, lerConsentimento, salvarConsentimento } from "./consentimento";

describe("consentimento", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
  });

  it("começa sem escolha", () => {
    expect(lerConsentimento()).toBeNull();
  });

  it("salva e lê a escolha", () => {
    salvarConsentimento("recusado");
    expect(lerConsentimento()).toBe("recusado");
  });

  it("ignora valor desconhecido no storage", () => {
    localStorage.setItem("lp_consentimento_v1", "talvez");
    expect(lerConsentimento()).toBeNull();
  });

  it("aceitar envia consent update granted", () => {
    aplicarConsentimento("aceito");
    const ultimo = Array.from(window.dataLayer!.at(-1) as unknown as ArrayLike<unknown>);
    expect(ultimo[0]).toBe("consent");
    expect(ultimo[1]).toBe("update");
    expect(ultimo[2]).toMatchObject({ analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
  });

  it("recusar envia consent update denied", () => {
    aplicarConsentimento("recusado");
    const ultimo = Array.from(window.dataLayer!.at(-1) as unknown as ArrayLike<unknown>);
    expect(ultimo[2]).toMatchObject({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  });
});
