import { CidadeProvider } from "@/context/CidadeContext";
import { JsonLd } from "@/components/JsonLd";
import { BotaoFlutuante } from "@/components/BotaoFlutuante";
import { S1Topbar } from "@/sections/S1Topbar";
import { S2Hero } from "@/sections/S2Hero";
import { S3Identificacao } from "@/sections/S3Identificacao";
import { S6OndeAtende } from "@/sections/S6OndeAtende";

export default function App() {
  return (
    <>
      <S1Topbar />
      <main id="conteudo">
        <CidadeProvider>
          <S2Hero />
          <S3Identificacao />
          <S6OndeAtende />
          <BotaoFlutuante />
        </CidadeProvider>
        <JsonLd />
      </main>
    </>
  );
}
