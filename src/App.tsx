import { CidadeProvider } from "@/context/CidadeContext";
import { JsonLd } from "@/components/JsonLd";
import { S6OndeAtende } from "@/sections/S6OndeAtende";

export default function App() {
  return (
    <main id="conteudo">
      <CidadeProvider>
        <h1>Dr. Patrick Santos</h1>
        <S6OndeAtende />
      </CidadeProvider>
      <JsonLd />
    </main>
  );
}
