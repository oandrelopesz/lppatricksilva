import { StrictMode, useEffect } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App";
import { iniciarMedicao } from "@/lib/medicao";
import { iniciarNavegacaoPorSecoes } from "./lib/navegacaoSecoes";

/** Liga as URLs por seção depois da hidratação (o efeito só roda com a página montada). */
function Raiz() {
  useEffect(() => iniciarNavegacaoPorSecoes(), []);
  return <App />;
}

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <Raiz />
  </StrictMode>
);

// Em produção o index.html já vem pré-renderizado: hidrata. Em dev, renderiza do zero.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

// Ordem da carga (spec §8 e §21): 1. limpeza do endereço, 2. pagina_limpa e 3. agendamento do GTM,
// aqui, logo depois de pedir a hidratação; 4. navegação por seções, no efeito do Raiz, depois dela.
iniciarMedicao();
