import { CidadeProvider } from "@/context/CidadeContext";

export default function App() {
  return (
    <main id="conteudo">
      <CidadeProvider>
        <h1>Dr. Patrick Santos</h1>
      </CidadeProvider>
    </main>
  );
}
