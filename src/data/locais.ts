export type RegiaoId = "sul-maranhense" | "centro-maranhense";

export interface Regiao {
  id: RegiaoId;
  nome: string;
}

export interface Local {
  id: string;
  nome: string;
  tipo: "clinica" | "hospital";
  /** Endereço por escrito, exatamente como no brief. É o texto exibido. */
  endereco: string;
  /** Parte do endereço antes da cidade (streetAddress do JSON-LD). */
  logradouro: string;
  cep?: string;
  /** Link "Como chegar", exatamente como no brief. */
  linkComoChegar: string;
  /** Nome da ficha no Google Maps, quando difere do nome exibido. Usado só no embed. */
  nomeNoMaps?: string;
  /** Divergência a reportar ao André. Não é exibida. */
  observacao?: string;
  /** Dias de atendimento. O dossiê não traz; fica ausente. */
  diasAtendimento?: string;
}

export interface Cidade {
  id: string;
  nome: string;
  regiaoId: RegiaoId;
  locais: Local[];
}

export const REGIOES: Regiao[] = [
  { id: "sul-maranhense", nome: "Sul Maranhense" },
  { id: "centro-maranhense", nome: "Centro Maranhense" },
];

export const CIDADES: Cidade[] = [
  {
    id: "balsas",
    nome: "Balsas",
    regiaoId: "sul-maranhense",
    locais: [
      {
        id: "mais-centro-medico",
        nome: "Mais Centro Médico",
        tipo: "clinica",
        endereco: "R. Antônio Jacobina, 820, Centro, Balsas-MA, 65800-000",
        logradouro: "R. Antônio Jacobina, 820, Centro",
        cep: "65800-000",
        linkComoChegar: "https://maps.google.com/?cid=7437967680173908744",
      },
      {
        id: "hospital-sao-jose",
        nome: "Hospital São José",
        tipo: "hospital",
        endereco: "Praça Dr. Roosevelt Kury, 80, Centro, Balsas-MA, 65800-000",
        logradouro: "Praça Dr. Roosevelt Kury, 80, Centro",
        cep: "65800-000",
        linkComoChegar: "https://maps.google.com/?cid=11424565659597188283",
      },
      {
        id: "clinica-mais-saude",
        nome: "Clínica Mais Saúde",
        tipo: "clinica",
        endereco: "Av. Seis, nº 10, QD 03, Cohab I, próximo à UPA, Balsas-MA, 65800-000",
        logradouro: "Av. Seis, nº 10, QD 03, Cohab I, próximo à UPA",
        cep: "65800-000",
        linkComoChegar: "https://maps.google.com/?cid=6068533600021052492",
      },
    ],
  },
  {
    id: "sao-domingos-do-azeitao",
    nome: "São Domingos do Azeitão",
    regiaoId: "sul-maranhense",
    locais: [
      {
        id: "clinica-santa-maria",
        nome: "Clínica Santa Maria",
        tipo: "clinica",
        endereco: "Av. Mário Bezerra, nº 02, Ed. Carjás, Centro, São Domingos do Azeitão-MA, 65888-000",
        logradouro: "Av. Mário Bezerra, nº 02, Ed. Carjás, Centro",
        cep: "65888-000",
        linkComoChegar: "https://maps.google.com/?cid=15321157887920026297",
      },
    ],
  },
  {
    id: "sao-raimundo-das-mangabeiras",
    nome: "São Raimundo das Mangabeiras",
    regiaoId: "sul-maranhense",
    locais: [
      {
        id: "mendesclin",
        nome: "Mendesclin",
        tipo: "clinica",
        endereco: "Praça do Mercado Central, nº 14, São Raimundo das Mangabeiras-MA, 65840-000",
        logradouro: "Praça do Mercado Central, nº 14",
        cep: "65840-000",
        linkComoChegar: "https://maps.google.com/?cid=9740273424993758535",
        observacao: "A ficha do Google Maps mostra R. Gonçalves Dias; a página exibe o endereço escrito no brief.",
      },
    ],
  },
  {
    id: "loreto",
    nome: "Loreto",
    regiaoId: "sul-maranhense",
    locais: [
      {
        id: "clinimed",
        nome: "Clinimed",
        tipo: "clinica",
        endereco: "Rua 28 de Julho, Centro, Loreto-MA, 65895-000",
        logradouro: "Rua 28 de Julho, Centro",
        cep: "65895-000",
        linkComoChegar: "https://www.google.com/maps/search/?api=1&query=Clinimed+Rua+28+de+Julho+Centro+Loreto+MA",
        observacao: "Sem número no endereço e sem ficha no Google Maps.",
      },
    ],
  },
  {
    id: "presidente-dutra",
    nome: "Presidente Dutra",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "clinica-levive",
        nome: "Clínica Levive",
        tipo: "clinica",
        endereco: "R. 28 de Junho Sul, 583B, Centro, Presidente Dutra-MA, 65760-000",
        logradouro: "R. 28 de Junho Sul, 583B, Centro",
        cep: "65760-000",
        linkComoChegar: "https://maps.google.com/?cid=17164339941155462225",
        observacao: "O dossiê mostra peças da Clínica Pró Saúde em Presidente Dutra; confirmar o local atual.",
      },
    ],
  },
  {
    id: "fortuna",
    nome: "Fortuna",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "clinica-risalva-carvalho",
        nome: "Clínica Risalva Carvalho",
        tipo: "clinica",
        endereco: "R. Quinze de Novembro, 741, Fortuna-MA, 65695-000",
        logradouro: "R. Quinze de Novembro, 741",
        cep: "65695-000",
        linkComoChegar: "https://maps.google.com/?cid=11359199694068869673",
      },
    ],
  },
  {
    id: "goncalves-dias",
    nome: "Gonçalves Dias",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "begmed",
        nome: "BegMed Centro de Especialidades",
        tipo: "clinica",
        endereco: "R. Almir Assis, 44, Centro, Gonçalves Dias-MA, 65775-000",
        logradouro: "R. Almir Assis, 44, Centro",
        cep: "65775-000",
        linkComoChegar: "https://maps.google.com/?cid=12044711327520027163",
      },
    ],
  },
  {
    id: "sao-domingos-do-maranhao",
    nome: "São Domingos do Maranhão",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "sd-med",
        nome: "SD MED",
        tipo: "clinica",
        endereco: "R. Quinze de Novembro, 49B, Centro, São Domingos do Maranhão-MA, 65790-000",
        logradouro: "R. Quinze de Novembro, 49B, Centro",
        cep: "65790-000",
        linkComoChegar: "https://maps.google.com/?cid=8715891456907011906",
      },
    ],
  },
  {
    id: "tuntum",
    nome: "Tuntum",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "cm-lab-tuntum",
        nome: "CM LAB (matriz)",
        tipo: "clinica",
        endereco: "R. dos Andrades, 58, Centro, Tuntum-MA, 65763-000",
        logradouro: "R. dos Andrades, 58, Centro",
        cep: "65763-000",
        linkComoChegar: "https://maps.google.com/?cid=8849807200489165564",
        nomeNoMaps: "CMT Centro Médico de Tuntum e Laboratório",
      },
    ],
  },
  {
    id: "graca-aranha",
    nome: "Graça Aranha",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "cm-lab-graca-aranha",
        nome: "CM LAB (filial)",
        tipo: "clinica",
        endereco: "Rua São Francisco, s/n, Centro, Graça Aranha-MA",
        logradouro: "Rua São Francisco, s/n, Centro",
        linkComoChegar: "https://www.google.com/maps/search/?api=1&query=CM+LAB+Rua+Sao+Francisco+Centro+Graca+Aranha+MA",
        observacao: "Sem número no endereço e sem ficha no Google Maps.",
      },
    ],
  },
  {
    id: "barra-do-corda",
    nome: "Barra do Corda",
    regiaoId: "centro-maranhense",
    locais: [
      {
        id: "clinica-mais-familia",
        nome: "Clínica Mais Família",
        tipo: "clinica",
        endereco: "R. Gerôncio Falcão, 263-A, Centro, Barra do Corda-MA, 65950-000",
        logradouro: "R. Gerôncio Falcão, 263-A, Centro",
        cep: "65950-000",
        linkComoChegar: "https://maps.google.com/?cid=492768669301912196",
        observacao: "Sem ficha própria no Google Maps; o link aponta para o endereço.",
      },
      {
        id: "hospital-florencio-brandes",
        nome: "Hospital Florêncio Brandes",
        tipo: "hospital",
        endereco: "R. Gonçalves Dias, 500, Barra do Corda-MA, 65950-000",
        logradouro: "R. Gonçalves Dias, 500",
        cep: "65950-000",
        linkComoChegar: "https://maps.google.com/?cid=16982940995158165296",
      },
    ],
  },
];

export function todosOsLocais(): Array<{ cidade: Cidade; local: Local }> {
  return CIDADES.flatMap((cidade) => cidade.locais.map((local) => ({ cidade, local })));
}

export function buscarCidade(id: string | null | undefined): Cidade | undefined {
  if (!id) return undefined;
  return CIDADES.find((cidade) => cidade.id === id);
}

export function cidadesDaRegiao(regiaoId: RegiaoId): Cidade[] {
  return CIDADES.filter((cidade) => cidade.regiaoId === regiaoId);
}

export function urlEmbedMapa(local: Local): string {
  const params = new URLSearchParams({ q: `${local.nomeNoMaps ?? local.nome} ${local.endereco}`, output: "embed" });
  return `https://www.google.com/maps?${params.toString()}`;
}
