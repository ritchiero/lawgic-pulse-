import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ReportPreview from "@/components/ReportPreview";

export default function Home() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: practiceAreas, isLoading: areasLoading } = trpc.subscription.getPracticeAreas.useQuery();
  const createSubscription = trpc.subscription.create.useMutation();

  const handleAreaToggle = (areaCode: string) => {
    setSelectedAreas(prev =>
      prev.includes(areaCode)
        ? prev.filter(a => a !== areaCode)
        : [...prev, areaCode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAreas.length === 0) {
      toast.error("Selecciona al menos un área de práctica");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createSubscription.mutateAsync({
        email,
        name: name || undefined,
        areas: selectedAreas
      });

      // Show success message
      toast.success("¡Suscripción creada! Redirigiendo...");

      // Redirect to thank you page
      setTimeout(() => {
        window.location.href = result.redirectUrl;
      }, 1000);

    } catch (error: any) {
      toast.error(error.message || "Error al procesar la suscripción");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇲🇽</span>
            <div>
              <h1 className="text-xl font-bold text-foreground">Lawgic Pulse</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-sm uppercase tracking-wide text-muted-foreground font-medium">
              Monitoreo Activo · Actualizado Diariamente
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight">
            <span className="text-foreground">Tu radar legal: </span>
            <span className="text-primary italic font-serif">DOF + Jurisprudencia</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl border-l-4 border-border pl-4">
            Recibe cada mañana las publicaciones del DOF relevantes para tus áreas de práctica, 
            más un resumen semanal de tesis, jurisprudencias y criterios cada viernes. 
            Todo resumido y clasificado automáticamente con inteligencia artificial.
          </p>

          {/* Stats */}
          <div className="flex gap-12 mb-12">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-1">$49</div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground">MXN/mes</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-1">25</div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground">Áreas de práctica</div>
            </div>
          </div>

          {/* Subscription Form */}
          <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email profesional
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@despacho.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Nombre <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Lic. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                />
              </div>

              {/* Practice Areas */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Áreas de práctica ({selectedAreas.length}/25) <span className="text-muted-foreground font-normal">(selecciona al menos una)</span>
                </Label>

                {areasLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {practiceAreas?.map((area) => (
                      <label
                        key={area.code}
                        className={`flex items-center gap-3 p-3 rounded-md border transition-colors cursor-pointer ${
                          selectedAreas.includes(area.code)
                            ? 'bg-accent border-accent-foreground/20'
                            : 'bg-muted border-border hover:bg-muted/80'
                        }`}
                      >
                        <Checkbox
                          checked={selectedAreas.includes(area.code)}
                          onCheckedChange={() => handleAreaToggle(area.code)}
                        />
                        <span className="text-sm font-medium">{area.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full text-base font-semibold"
                disabled={isSubmitting || selectedAreas.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  `Suscribirme - $49 MXN/mes`
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Cancela cuando quieras. Sin compromisos.
              </p>
            </form>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-2xl mb-2">📬</div>
              <h3 className="font-semibold text-foreground">Diario: DOF</h3>
              <p className="text-sm text-muted-foreground">
                Cada mañana antes de las 8:00 AM
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-semibold text-foreground">Viernes: Tesis</h3>
              <p className="text-sm text-muted-foreground">
                Jurisprudencias y criterios relevantes
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-foreground">Filtrado inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Solo lo relevante para tus áreas
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold text-foreground">Resúmenes con IA</h3>
              <p className="text-sm text-muted-foreground">
                Entiendes sin leer 50 páginas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Report Preview */}
      <ReportPreview />

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            Un servicio de{" "}
            <a href="https://lawgic.io" className="text-primary hover:underline">
              Lawgic
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
