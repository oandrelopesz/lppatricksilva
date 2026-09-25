import { agendarGtm, registrarPagina } from "@/lib/analytics";
import { limparEndereco } from "@/lib/origem";
import { observarProfundidade } from "@/lib/profundidade";

let iniciada = false;

/**
 * Chamada uma vez, depois da hidratação. registrarPagina vem antes do GTM para o page_location
 * já sair limpo (spec §8).
 */
export function iniciarMedicao(): void {
  if (iniciada) return;
  iniciada = true;
  // O padrão do resource timing é 250 entradas; cheio, a conversão do clique tardio não entra nem no
  // buffered do observador nem no getEntriesByType (validação 3 do Tracking).
  performance.setResourceTimingBufferSize?.(1000);
  // 1. Barra de endereço sem utm_term nem UTM fora da convenção: a tag do Ads e o ccm/collect mandam
  //    a URL completa (spec §8). Antes do pagina_limpa e do GTM.
  limparEndereco();
  // 2. pagina_limpa; 3. agendamento do GTM.
  registrarPagina();
  agendarGtm();
  observarProfundidade();
  // URL por seção (spec §21, decisão (b) do R20): cada troca de URL atualiza o pagina_limpa, sem
  // evento e sem page_view; as tags de evento leem {{DLV - pagina_limpa}}.
  window.addEventListener("lp:secao", () => registrarPagina());
}
