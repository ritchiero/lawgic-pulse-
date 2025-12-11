import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Document {
  title: string;
  documentType: string;
  areas: string[];
  summary: string;
  url: string;
}

export default function ReportPreview() {
  const [showLive, setShowLive] = useState(false);
  
  const { data: livePreview, isLoading, refetch } = trpc.preview.getDaily.useQuery(
    {},
    { enabled: showLive }
  );

  const handleShowLive = async () => {
    setShowLive(true);
    toast.info("Generando reporte en tiempo real...");
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

  return (
    <section className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-foreground mb-3">
            Así se ve tu reporte diario
          </h3>
          <p className="text-lg text-muted-foreground mb-6">
            Cada mañana recibirás un email con los documentos del DOF relevantes para tus áreas, 
            resumidos y clasificados automáticamente con IA.
          </p>
          
          {!showLive && (
            <Button 
              onClick={handleShowLive}
              variant="outline"
              className="mb-6"
            >
              Ver reporte de hoy en tiempo real →
            </Button>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scrapeando DOF y clasificando con IA...</span>
            </div>
          )}

          {isLiveData && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              Reporte en vivo del DOF de hoy
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="space-y-4">
          {displayDocuments.map((doc, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">
                        {doc.documentType}
                      </span>
                      {doc.areas.map((area, i) => (
                        <span 
                          key={i}
                          className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      {doc.title}
                    </CardTitle>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {doc.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {showLive && livePreview?.isSample ? (
              <>No hay documentos nuevos en el DOF hoy. Arriba se muestra un ejemplo de cómo se vería tu reporte.</>
            ) : (
              <>Este es solo un ejemplo. Los reportes reales incluyen todos los documentos relevantes del día.</>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
