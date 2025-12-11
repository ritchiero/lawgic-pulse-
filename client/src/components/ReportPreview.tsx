import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ExternalLink, Calendar, FileText, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Document {
  title: string;
  documentType: string;
  areas: string[];
  summary: string;
  url: string;
  publisher?: string;
  effectiveDate?: string;
  impact?: "high" | "medium" | "low";
}

const AREA_LABELS: Record<string, string> = {
  fiscal: "Fiscal",
  laboral: "Laboral",
  mercantil: "Mercantil",
  financiero: "Financiero",
  energia: "Energía",
  ambiental: "Ambiental",
  propiedad_intelectual: "PI",
  competencia: "Competencia",
  administrativo: "Administrativo",
  constitucional: "Constitucional",
  comercio_exterior: "ComEx",
  salud: "Salud"
};

const IMPACT_CONFIG = {
  high: { label: "Alto Impacto", color: "bg-red-100 text-red-700 border-red-300", icon: AlertCircle },
  medium: { label: "Impacto Medio", color: "bg-orange-100 text-orange-700 border-orange-300", icon: TrendingUp },
  low: { label: "Bajo Impacto", color: "bg-blue-100 text-blue-700 border-blue-300", icon: FileText }
};

export default function ReportPreview() {
  const [showLive, setShowLive] = useState(false);
  
  const { data: livePreview, isLoading, refetch } = trpc.preview.getDaily.useQuery(
    {},
    { enabled: showLive }
  );

  const handleShowLive = async () => {
    setShowLive(true);
    toast.info("Scrapeando DOF y clasificando con IA...", { duration: 3000 });
    await refetch();
  };

  // Enhanced sample data with specific details
  const sampleDocuments: Document[] = [
    {
      title: "Reforma al ISR: Nuevas deducciones autorizadas",
      documentType: "DECRETO",
      areas: ["fiscal"],
      summary: "**Vigencia:** 1 enero 2025 | **Modifica:** Arts. 25 y 28 LISR | **Impacto:** Amplía deducciones para inversiones en tecnología hasta 150% y elimina el límite de $5M para deducciones inmediatas. Aplica a personas morales del régimen general.",
      url: "https://www.dof.gob.mx",
      publisher: "SHCP",
      effectiveDate: "1 enero 2025",
      impact: "high"
    },
    {
      title: "Horario de verano 2025: Fechas actualizadas",
      documentType: "ACUERDO",
      areas: ["administrativo"],
      summary: "**Vigencia:** Inmediata | **Periodo:** 6 abril - 26 octubre 2025 | **Impacto:** Ajuste de una hora en horarios laborales y trámites. Afecta contratos con cláusulas horarias específicas y plazos procesales.",
      url: "https://www.dof.gob.mx",
      publisher: "SEGOB",
      effectiveDate: "Inmediata",
      impact: "low"
    },
    {
      title: "RMF 2024: Facilidades para exportadores",
      documentType: "RESOLUCIÓN",
      areas: ["fiscal", "comercio_exterior"],
      summary: "**Vigencia:** 15 diciembre 2024 | **Nuevas reglas:** 3.3.1.15 y 3.3.1.16 | **Impacto:** Elimina requisito de dictamen para devoluciones de IVA <$2M y extiende plazo de certificación IMMEX de 30 a 60 días. Reduce carga administrativa en 40%.",
      url: "https://www.dof.gob.mx",
      publisher: "SAT",
      effectiveDate: "15 dic 2024",
      impact: "medium"
    }
  ];

  const displayDocuments = showLive && livePreview ? livePreview.documents.map((doc: any) => ({
    ...doc,
    impact: "medium" as const
  })) : sampleDocuments;
  
  const isLiveData = showLive && livePreview && !livePreview.isSample;
  const reportDate = livePreview?.date ? new Date(livePreview.date) : new Date();

  return (
    <section className="bg-gradient-to-b from-background to-muted/20 py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Así se ve tu reporte diario
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Información clave, resúmenes específicos y análisis de impacto. 
            Todo lo que necesitas saber en <strong>2 minutos</strong> vs 2 horas leyendo el DOF completo.
          </p>
          
          {!showLive && (
            <Button 
              onClick={handleShowLive}
              size="lg"
              className="font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <FileText className="w-5 h-5 mr-2" />
              Ver reporte de hoy en tiempo real
            </Button>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Scrapeando DOF y clasificando con IA...
              </p>
            </div>
          )}
        </div>

        {/* Value Proposition */}
        {!isLoading && (
          <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Ahorra 2 horas diarias
                </h4>
                <p className="text-sm text-muted-foreground">
                  En lugar de leer 50-100 páginas del DOF, recibes solo lo relevante para tus áreas 
                  con análisis de impacto, fechas de vigencia y artículos modificados. 
                  <strong className="text-foreground"> Eso son 40 horas al mes = $XX,XXX MXN en tiempo profesional.</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report Metadata */}
        {!isLoading && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {reportDate.toLocaleDateString('es-MX', { 
                      weekday: 'long', 
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{displayDocuments.length}</span> documentos relevantes
                  </span>
                </div>
              </div>
              
              {isLiveData && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  Reporte en vivo
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="space-y-5">
          {displayDocuments.map((doc, index) => {
            const impactLevel = (doc.impact || "medium") as keyof typeof IMPACT_CONFIG;
            const impactConfig = IMPACT_CONFIG[impactLevel];
            const ImpactIcon = impactConfig.icon;
            
            return (
              <Card key={index} className="hover:shadow-xl transition-all duration-200 border-l-4 border-l-primary overflow-hidden">
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-primary text-primary-foreground rounded uppercase">
                          {doc.documentType}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded border ${impactConfig.color}`}>
                          <ImpactIcon className="w-3 h-3" />
                          {impactConfig.label}
                        </span>
                        {doc.areas.map((area: string, i: number) => (
                          <span 
                            key={i}
                            className="inline-flex items-center text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded"
                          >
                            {AREA_LABELS[area] || area}
                          </span>
                        ))}
                      </div>
                      
                      {/* Title */}
                      <h4 className="text-xl font-bold text-foreground leading-tight mb-2">
                        {doc.title}
                      </h4>
                      
                      {/* Meta Info */}
                      {(doc.publisher || doc.effectiveDate) && (
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                          {doc.publisher && (
                            <span className="font-medium">📋 {doc.publisher}</span>
                          )}
                          {doc.effectiveDate && (
                            <span className="font-medium">📅 Vigencia: {doc.effectiveDate}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* External Link */}
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Ver documento completo en DOF"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                  
                  {/* Summary */}
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {doc.summary}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-10 text-center">
          <div className="inline-block bg-card border border-border rounded-lg p-6 max-w-2xl">
            <p className="text-sm text-muted-foreground mb-2">
              {showLive && livePreview?.isSample ? (
                <>💡 No hay documentos nuevos en el DOF hoy. Arriba se muestra un ejemplo realista.</>
              ) : (
                <>📧 Este es un ejemplo. Los reportes reales incluyen <strong className="text-foreground">todos</strong> los documentos relevantes con el mismo nivel de detalle.</>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Cada resumen incluye: vigencia, artículos modificados, impacto cuantificado y contexto práctico.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
