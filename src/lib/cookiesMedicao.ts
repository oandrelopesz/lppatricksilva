import type { Escolha } from "@/lib/consentimento";

/** Cookies de medição que a própria página cria pelo GTM, por categoria (parecer R36, item 10). */
const DE_VISITAS = (nome: string) => nome === "_ga" || nome.startsWith("_ga_");
const DE_ANUNCIOS = (nome: string) => ["_gcl_au", "_gcl_aw", "_gcl_dc", "_gcl_gb", "_gcl_gs"].includes(nome);

const EXPIRADO = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

/** O domínio atual e os pais (o GA grava no domínio mais alto que o navegador aceita). */
function dominios(host: string): string[] {
  const partes = host.split(".");
  const pais = partes.slice(1, -1).map((_, i) => `.${partes.slice(i + 1).join(".")}`);
  return partes.length > 1 ? [host, `.${host}`, ...pais] : [];
}

/**
 * Depois de uma escolha, apaga os cookies de medição das categorias desligadas. A mudança de
 * consentimento já vale para as próximas medições; isto remove o que a página criou antes.
 */
export function apagarCookiesRevogados(
  escolha: Escolha,
  doc: { cookie: string } = document,
  host: string = window.location.hostname,
): void {
  const revogado = (nome: string) => (!escolha.visitas && DE_VISITAS(nome)) || (!escolha.anuncios && DE_ANUNCIOS(nome));
  const nomes = doc.cookie
    .split(";")
    .map((par) => par.split("=")[0].trim())
    .filter((nome) => nome && revogado(nome));
  for (const nome of new Set(nomes)) {
    doc.cookie = `${nome}=; ${EXPIRADO}`;
    for (const dominio of dominios(host)) doc.cookie = `${nome}=; ${EXPIRADO}; domain=${dominio}`;
  }
}
