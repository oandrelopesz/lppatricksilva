import { StrictMode, useEffect } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App";
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
