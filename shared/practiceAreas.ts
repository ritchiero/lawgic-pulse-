/**
 * Legal practice areas catalog for Mexican law
 */

export interface PracticeArea {
  code: string;
  name: string;
  keywords: string[];
}

export const PRACTICE_AREAS: Record<string, PracticeArea> = {
  fiscal: {
    code: "fiscal",
    name: "Fiscal y Tributario",
    keywords: ["impuesto", "SAT", "ISR", "IVA", "IEPS", "contribuciones", "fiscal", "tributario", "miscelánea fiscal", "código fiscal"]
  },
  laboral: {
    code: "laboral",
    name: "Laboral y Seguridad Social",
    keywords: ["trabajo", "laboral", "IMSS", "INFONAVIT", "sindicato", "salario", "despido", "LFT", "seguridad social", "pensiones"]
  },
  mercantil: {
    code: "mercantil",
    name: "Mercantil y Corporativo",
    keywords: ["sociedad", "mercantil", "corporativo", "acciones", "asamblea", "fusión", "escisión", "LGSM", "comercio"]
  },
  financiero: {
    code: "financiero",
    name: "Financiero y Bancario",
    keywords: ["banco", "crédito", "CNBV", "Banxico", "financiero", "bursátil", "valores", "fintech", "seguros", "fianzas"]
  },
  energia: {
    code: "energia",
    name: "Energía e Hidrocarburos",
    keywords: ["energía", "hidrocarburos", "petróleo", "electricidad", "CRE", "CNH", "PEMEX", "CFE", "renovable", "SENER"]
  },
  ambiental: {
    code: "ambiental",
    name: "Ambiental",
    keywords: ["ambiente", "ecología", "SEMARNAT", "impacto ambiental", "residuos", "agua", "CONAGUA", "forestal"]
  },
  propiedad_intelectual: {
    code: "propiedad_intelectual",
    name: "Propiedad Intelectual",
    keywords: ["marca", "patente", "autor", "IMPI", "INDAUTOR", "propiedad intelectual", "diseño industrial", "franquicia"]
  },
  competencia: {
    code: "competencia",
    name: "Competencia Económica",
    keywords: ["COFECE", "competencia", "concentración", "monopolio", "prácticas monopólicas", "IFT"]
  },
  administrativo: {
    code: "administrativo",
    name: "Administrativo",
    keywords: ["licitación", "concesión", "permiso", "licencia", "administrativo", "contratación pública", "gobierno"]
  },
  constitucional: {
    code: "constitucional",
    name: "Constitucional y Amparo",
    keywords: ["constitución", "amparo", "derechos humanos", "SCJN", "inconstitucionalidad", "controversia constitucional"]
  },
  comercio_exterior: {
    code: "comercio_exterior",
    name: "Comercio Exterior y Aduanas",
    keywords: ["aduana", "importación", "exportación", "T-MEC", "aranceles", "comercio exterior", "IMMEX", "dumping"]
  },
  salud: {
    code: "salud",
    name: "Salud y Farmacéutico",
    keywords: ["COFEPRIS", "sanitario", "medicamento", "salud", "farmacéutico", "dispositivo médico", "cannabis"]
  }
};

export const PRACTICE_AREA_CODES = Object.keys(PRACTICE_AREAS);

export const PRACTICE_AREA_NAMES = Object.values(PRACTICE_AREAS).reduce((acc, area) => {
  acc[area.code] = area.name;
  return acc;
}, {} as Record<string, string>);
