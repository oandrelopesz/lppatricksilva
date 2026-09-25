import { describe, expect, it } from "vitest";
import { gerarJsonLd, idDoLocal, jsonLdComoTexto } from "./jsonld";
import { todosOsLocais } from "./locais";

type No = { "@type": string; "@id": string; [chave: string]: unknown };

describe("jsonld", () => {
  const grafo = gerarJsonLd()["@graph"] as No[];

  it("tem 1 médico, 12 clínicas e 2 hospitais", () => {
    expect(grafo.filter((n) => n["@type"] === "IndividualPhysician")).toHaveLength(1);
    expect(grafo.filter((n) => n["@type"] === "MedicalClinic")).toHaveLength(12);
    expect(grafo.filter((n) => n["@type"] === "Hospital")).toHaveLength(2);
  });

  it("practicesAt aponta para os 14 locais", () => {
    const medico = grafo[0] as No & { practicesAt: Array<{ "@id": string }> };
    const idsLocais = grafo.slice(1).map((n) => n["@id"]);
    expect(medico.practicesAt.map((p) => p["@id"])).toEqual(idsLocais);
    expect(idsLocais).toContain(idDoLocal("mendesclin"));
  });

  it("identifica CRM-MA e RQE", () => {
    const medico = grafo[0] as No & { identifier: Array<{ propertyID: string; value: string }> };
    expect(medico.identifier).toEqual([
      { "@type": "PropertyValue", propertyID: "CRM-MA", value: "16520" },
      { "@type": "PropertyValue", propertyID: "RQE", value: "7389" },
    ]);
  });

  it("CM LAB de Graça Aranha ganha o CEP confirmado no Instagram", () => {
    const graca = grafo.find((n) => n["@id"] === idDoLocal("cm-lab-graca-aranha")) as No & { address: Record<string, string> };
    expect(graca.address.postalCode).toBe("65785-000");
    expect(graca.address.addressLocality).toBe("Graça Aranha");
  });

  it("postalCode segue o CEP de cada local", () => {
    for (const { local } of todosOsLocais()) {
      const no = grafo.find((n) => n["@id"] === idDoLocal(local.id)) as No & { address: Record<string, string> };
      expect(no.address.postalCode).toBe(local.cep);
    }
  });

  it("o texto não tem < cru", () => {
    expect(jsonLdComoTexto()).not.toContain("<");
  });
});
