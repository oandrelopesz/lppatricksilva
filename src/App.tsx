import { CidadeProvider } from "@/context/CidadeContext";
import { JsonLd } from "@/components/JsonLd";
import { S1Topbar } from "@/sections/S1Topbar";
import { S2Hero } from "@/sections/S2Hero";
import { S3Identificacao } from "@/sections/S3Identificacao";
import { S4ComoFunciona } from "@/sections/S4ComoFunciona";
import { S5Sobre } from "@/sections/S5Sobre";
import { S6OndeAtende } from "@/sections/S6OndeAtende";
import { S7Faq } from "@/sections/S7Faq";
import { S8Rodape } from "@/sections/S8Rodape";

export default function App() {
  return (
    <>
      <S1Topbar />
      <main id="conteudo">
        <CidadeProvider>
          <S2Hero />
          <S3Identificacao />
          <S4ComoFunciona />
          <S5Sobre />
          <S6OndeAtende />
          <S7Faq />
          <S8Rodape />
        </CidadeProvider>
        <JsonLd />
      </main>
    </>
  );
}
