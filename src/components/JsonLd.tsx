import { jsonLdComoTexto } from "@/data/jsonld";

export function JsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdComoTexto() }} />;
}
