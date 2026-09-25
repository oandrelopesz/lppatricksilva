import { agendarGtm, registrarPagina } from "@/lib/analytics";
import { observarProfundidade } from "@/lib/profundidade";

let iniciada = false;

/**
 * Chamada uma vez, depois da hidratação. registrarPagina vem antes do GTM para o page_location
 * já sair limpo (spec §8).
 */
export function iniciarMedicao(): void {
  if (iniciada) return;
  iniciada = true;
  registrarPagina();
  agendarGtm();
  observarProfundidade();
  // URL por seção (spec §21, decisão (b) do R20): cada troca de URL atualiza o pagina_limpa, sem
  // evento e sem page_view; as tags de evento leem {{DLV - pagina_limpa}}.
  window.addEventListener("lp:secao", () => registrarPagina());
}
