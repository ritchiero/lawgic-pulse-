import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ReportPreview from "@/components/ReportPreview";
import { motion } from "framer-motion";

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

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
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
      <section className="container mx-auto py-12 md:py-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_theme(colors.primary.DEFAULT)]"></div>
              <span className="text-sm uppercase tracking-wide text-muted-foreground font-medium">
                Monitoreo Activo · Actualizado Diariamente
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight">
              <span className="text-foreground">Tu radar legal: </span>
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic font-serif">DOF + Jurisprudencia</span>
            </motion.h2>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl border-l-4 border-primary/20 pl-4">
              Recibe cada mañana las publicaciones del DOF relevantes para tus áreas de práctica, 
              más un resumen semanal de tesis, jurisprudencias y criterios cada viernes. 
              Todo resumido y clasificado automáticamente con inteligencia artificial.
            </motion.p>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="flex gap-12 mb-12">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-1">$49</div>
                <div className="text-sm uppercase tracking-wide text-muted-foreground">MXN/mes</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-1">25</div>
                <div className="text-sm uppercase tracking-wide text-muted-foreground">Áreas de práctica</div>
              </div>
            </motion.div>

            {/* Subscription Form */}
            <motion.div variants={fadeInUp} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
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
                    className="bg-background/50 border-border/50 focus:border-primary transition-colors"
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
                    className="bg-background/50 border-border/50 focus:border-primary transition-colors"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
                      {practiceAreas?.map((area) => (
                        <motion.label
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={area.code}
                          className={`flex items-center gap-3 p-3 rounded-md border transition-all cursor-pointer ${
                            selectedAreas.includes(area.code)
                              ? 'bg-primary/5 border-primary/30 shadow-sm'
                              : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={selectedAreas.includes(area.code)}
                            onCheckedChange={() => handleAreaToggle(area.code)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                          <span className="text-sm font-medium">{area.name}</span>
                        </motion.label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
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
            </motion.div>

            {/* Features */}
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { icon: "📬", title: "Diario: DOF", desc: "Cada mañana antes de las 8:00 AM" },
                { icon: "📚", title: "Viernes: Tesis", desc: "Jurisprudencias y criterios relevantes" },
                { icon: "🎯", title: "Filtrado inteligente", desc: "Solo lo relevante para tus áreas" },
                { icon: "🤖", title: "Resúmenes con IA", desc: "Entiendes sin leer 50 páginas" }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="space-y-3 p-4 rounded-lg hover:bg-accent/5 transition-colors border border-transparent hover:border-border/50"
                >
                  <div className="text-3xl mb-2 bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">{feature.icon}</div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Report Preview */}
      <ReportPreview />

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8 bg-card/30">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            Un servicio de{" "}
            <a href="https://lawgic.io" className="text-primary hover:underline hover:text-primary/80 transition-colors">
              Lawgic
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
