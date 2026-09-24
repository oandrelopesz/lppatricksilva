import { renderToString } from "react-dom/server";
import App from "./App";

/** Usado só no build: gera o HTML estático da página para o index.html. */
export function render() {
  return renderToString(<App />);
}
