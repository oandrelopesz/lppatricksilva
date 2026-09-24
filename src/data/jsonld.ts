import { MEDICO, SITE_URL, WHATSAPP_NUMERO } from "@/config";
import { todosOsLocais } from "@/data/locais";

export function idDoLocal(localId: string): string {
  return `${SITE_URL}/#local-${localId}`;
}

export function gerarJsonLd() {
  const locais = todosOsLocais().map(({ cidade, local }) => ({
    "@type": local.tipo === "hospital" ? "Hospital" : "MedicalClinic",
    "@id": idDoLocal(local.id),
    name: local.nome,
    address: {
      "@type": "PostalAddress",
      streetAddress: local.logradouro,
      addressLocality: cidade.nome,
      addressRegion: "MA",
      ...(local.cep ? { postalCode: local.cep } : {}),
      addressCountry: "BR",
    },
    hasMap: local.linkComoChegar,
  }));

  const medico = {
    "@type": "IndividualPhysician",
    "@id": `${SITE_URL}/#medico`,
    name: MEDICO.nome,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/img/hero-960.webp`,
    telephone: `+${WHATSAPP_NUMERO}`,
    medicalSpecialty: "https://schema.org/Musculoskeletal",
    identifier: [
      { "@type": "PropertyValue", propertyID: `CRM-${MEDICO.crmUf}`, value: MEDICO.crmNumero },
      { "@type": "PropertyValue", propertyID: "RQE", value: MEDICO.rqeNumero },
    ],
    practicesAt: locais.map((local) => ({ "@id": local["@id"] })),
  };

  return { "@context": "https://schema.org", "@graph": [medico, ...locais] };
}

export function jsonLdComoTexto(): string {
  return JSON.stringify(gerarJsonLd()).replace(/</g, "\\u003c");
}
