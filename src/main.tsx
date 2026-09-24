import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App";
import { iniciarMedicao } from "@/lib/medicao";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Em produção o index.html já vem pré-renderizado: hidrata. Em dev, renderiza do zero.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

// Fila (pagina_limpa) antes do GTM; o GTM carrega depois do primeiro frame; rolagem uma vez só.
iniciarMedicao();
