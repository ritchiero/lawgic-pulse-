import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ExternalLink, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";

interface Document {
  title: string;
  documentType: string;
  areas: string[];
  summary: string;
  url: string;
}

const AREA_LABELS: Record<string, string> = {
  fiscal: "Fiscal",
  laboral: "Laboral",
  mercantil: "Mercantil",
  financiero: "Financiero",
  energia: "Energía",
  ambiental: "Ambiental",
  propiedad_intelectual: "Propiedad Intelectual",
  competencia: "Competencia",
  administrativo: "Administrativo",
  constitucional: "Constitucional",
  comercio_exterior: "Comercio Exterior",
  salud: "Salud"
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

  // Static sample data
  const sampleDocuments: Document[] = [
    {
      title: "ACUERDO por el que se modifica el diverso que establece el horario de verano",
      documentType: "ACUERDO",
      areas: ["administrativo"],
      summary: "Se establecen las fechas de inicio y término del horario de verano para el ejercicio fiscal 2025.",
      url: "https://www.dof.gob.mx"
    },
    {
      title: "DECRETO por el que se reforman diversas disposiciones de la Ley del ISR",
      documentType: "DECRETO",
      areas: ["fiscal"],
      summary: "Se modifican los artículos 25 y 28 de la LISR para actualizar las deducciones autorizadas y el tratamiento de inversiones.",
      url: "https://www.dof.gob.mx"
    },
    {
      title: "RESOLUCIÓN que modifica la Resolución Miscelánea Fiscal para 2024",
      documentType: "RESOLUCIÓN",
      areas: ["fiscal", "comercio_exterior"],
      summary: "Se actualizan las reglas para la presentación de declaraciones complementarias y se establecen facilidades para contribuyentes del sector exportador.",
      url: "https://www.dof.gob.mx"
    }
  ];

  const displayDocuments = showLive && livePreview ? livePreview.documents : sampleDocuments;
  const isLiveData = showLive && livePreview && !livePreview.isSample;
  const reportDate = livePreview?.date ? new Date(livePreview.date) : new Date();

  return (
    <section className="bg-muted/30 py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Así se ve tu reporte diario
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Cada mañana recibirás un email con los documentos del DOF relevantes para tus áreas, 
            resumidos y clasificados automáticamente con IA.
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

        {/* Report Metadata */}
        {!isLoading && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {reportDate.toLocaleDateString('es-MX', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  Reporte en vivo
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="space-y-4">
          {displayDocuments.map((doc, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center text-xs font-bold px-3 py-1 bg-primary text-primary-foreground rounded-md uppercase tracking-wide">
                        {doc.documentType}
                      </span>
                      {doc.areas.map((area, i) => (
                        <span 
                          key={i}
                          className="inline-flex items-center text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md"
                        >
                          {AREA_LABELS[area] || area}
                        </span>
                      ))}
                    </div>
                    
                    {/* Title */}
                    <h4 className="text-lg font-bold text-foreground leading-tight pr-8">
                      {doc.title}
                    </h4>
                  </div>
                  
                  {/* External Link */}
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Ver en DOF"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {doc.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-4 inline-block">
            {showLive && livePreview?.isSample ? (
              <>💡 No hay documentos nuevos en el DOF hoy. Arriba se muestra un ejemplo de cómo se vería tu reporte.</>
            ) : (
              <>📧 Este es solo un ejemplo. Los reportes reales incluyen <strong>todos</strong> los documentos relevantes del día.</>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
