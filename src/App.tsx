import { CidadeProvider } from "@/context/CidadeContext";
import { JsonLd } from "@/components/JsonLd";

export default function App() {
  return (
    <main id="conteudo">
      <CidadeProvider>
        <h1>Dr. Patrick Santos</h1>
      </CidadeProvider>
      <JsonLd />
    </main>
  );
}
