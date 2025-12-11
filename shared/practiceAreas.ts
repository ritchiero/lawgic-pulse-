/**
 * Legal practice areas catalog for Mexican law
 * Expanded to 25+ practice areas
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
    keywords: ["impuesto", "SAT", "ISR", "IVA", "IEPS", "contribuciones", "fiscal", "tributario", "miscelánea fiscal", "código fiscal", "RFC", "declaración", "deducción"]
  },
  laboral: {
    code: "laboral",
    name: "Laboral y Seguridad Social",
    keywords: ["trabajo", "laboral", "IMSS", "INFONAVIT", "sindicato", "salario", "despido", "LFT", "seguridad social", "pensiones", "outsourcing", "subcontratación"]
  },
  mercantil: {
    code: "mercantil",
    name: "Mercantil y Corporativo",
    keywords: ["sociedad", "mercantil", "corporativo", "acciones", "asamblea", "fusión", "escisión", "LGSM", "comercio", "quiebra", "concurso mercantil"]
  },
  financiero: {
    code: "financiero",
    name: "Financiero y Bancario",
    keywords: ["banco", "crédito", "CNBV", "Banxico", "financiero", "bursátil", "valores", "fintech", "CONDUSEF", "inversión"]
  },
  energia: {
    code: "energia",
    name: "Energía e Hidrocarburos",
    keywords: ["energía", "hidrocarburos", "petróleo", "electricidad", "CRE", "CNH", "PEMEX", "CFE", "renovable", "SENER", "gas"]
  },
  ambiental: {
    code: "ambiental",
    name: "Ambiental",
    keywords: ["ambiente", "ecología", "SEMARNAT", "impacto ambiental", "residuos", "agua", "CONAGUA", "forestal", "PROFEPA", "emisiones"]
  },
  propiedad_intelectual: {
    code: "propiedad_intelectual",
    name: "Propiedad Intelectual",
    keywords: ["marca", "patente", "autor", "IMPI", "INDAUTOR", "propiedad intelectual", "diseño industrial", "franquicia", "secreto industrial", "copyright"]
  },
  competencia: {
    code: "competencia",
    name: "Competencia Económica",
    keywords: ["COFECE", "competencia", "concentración", "monopolio", "prácticas monopólicas", "IFT", "telecomunicaciones"]
  },
  administrativo: {
    code: "administrativo",
    name: "Administrativo",
    keywords: ["licitación", "concesión", "permiso", "licencia", "administrativo", "contratación pública", "gobierno", "contencioso", "responsabilidad administrativa"]
  },
  constitucional: {
    code: "constitucional",
    name: "Constitucional y Amparo",
    keywords: ["constitución", "amparo", "derechos humanos", "SCJN", "inconstitucionalidad", "controversia constitucional", "garantías"]
  },
  comercio_exterior: {
    code: "comercio_exterior",
    name: "Comercio Exterior y Aduanas",
    keywords: ["aduana", "importación", "exportación", "T-MEC", "aranceles", "comercio exterior", "IMMEX", "dumping", "reglas de origen"]
  },
  salud: {
    code: "salud",
    name: "Salud y Farmacéutico",
    keywords: ["COFEPRIS", "sanitario", "medicamento", "salud", "farmacéutico", "dispositivo médico", "cannabis", "hospital", "vacuna"]
  },
  penal: {
    code: "penal",
    name: "Penal",
    keywords: ["penal", "delito", "código penal", "proceso penal", "fiscalía", "ministerio público", "juicio oral", "prisión preventiva", "extinción de dominio"]
  },
  civil: {
    code: "civil",
    name: "Civil y Familiar",
    keywords: ["civil", "familia", "sucesiones", "contratos", "obligaciones", "propiedad", "arrendamiento", "registro civil", "divorcio", "testamento"]
  },
  seguros: {
    code: "seguros",
    name: "Seguros y Fianzas",
    keywords: ["seguro", "fianza", "aseguradora", "afianzadora", "póliza", "siniestro", "CNSF", "reaseguro"]
  },
  telecomunicaciones: {
    code: "telecomunicaciones",
    name: "Telecomunicaciones y Medios",
    keywords: ["telecomunicaciones", "IFT", "espectro", "radiodifusión", "internet", "telefonía", "concesión IFT", "must offer", "must carry"]
  },
  inmobiliario: {
    code: "inmobiliario",
    name: "Inmobiliario",
    keywords: ["inmobiliario", "bienes raíces", "propiedad", "registro público", "notario", "escritura", "catastro", "desarrollo inmobiliario"]
  },
  migratorio: {
    code: "migratorio",
    name: "Migratorio",
    keywords: ["migratorio", "INM", "visa", "extranjero", "nacionalidad", "refugiado", "trámite migratorio", "residencia", "naturalización"]
  },
  agrario: {
    code: "agrario",
    name: "Agrario",
    keywords: ["agrario", "ejido", "tierra", "RAN", "procuraduría agraria", "reforma agraria", "comunidad agraria", "núcleo agrario"]
  },
  transportes: {
    code: "transportes",
    name: "Transportes e Infraestructura",
    keywords: ["transporte", "SCT", "concesión transporte", "aeropuerto", "puerto", "ferrocarril", "autotransporte", "carretera", "infraestructura"]
  },
  educacion: {
    code: "educacion",
    name: "Educación",
    keywords: ["educación", "SEP", "escuela", "universidad", "RVOE", "educativo", "docente", "acreditación", "educación superior"]
  },
  turismo: {
    code: "turismo",
    name: "Turismo",
    keywords: ["turismo", "SECTUR", "hotelero", "turístico", "prestador de servicios turísticos", "zona turística", "tiempo compartido"]
  },
  datos_personales: {
    code: "datos_personales",
    name: "Protección de Datos Personales",
    keywords: ["datos personales", "INAI", "privacidad", "protección de datos", "aviso de privacidad", "LFPDPPP", "ARCO", "transferencia de datos"]
  },
  consumidor: {
    code: "consumidor",
    name: "Protección al Consumidor",
    keywords: ["consumidor", "PROFECO", "garantía", "publicidad", "contrato de adhesión", "derechos del consumidor", "proveedor"]
  },
  anticorrupcion: {
    code: "anticorrupcion",
    name: "Anticorrupción y Compliance",
    keywords: ["anticorrupción", "SNA", "responsabilidades administrativas", "conflicto de interés", "declaración patrimonial", "soborno", "compliance", "3de3"]
  }
};

export const PRACTICE_AREA_CODES = Object.keys(PRACTICE_AREAS);

export const PRACTICE_AREA_NAMES = Object.values(PRACTICE_AREAS).reduce((acc, area) => {
  acc[area.code] = area.name;
  return acc;
}, {} as Record<string, string>);
