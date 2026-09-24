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
}
