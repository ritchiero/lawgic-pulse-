import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { PRACTICE_AREAS, PRACTICE_AREA_CODES } from "../../../shared/practiceAreas";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: status, isLoading, refetch } = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: !!user
  });

  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateAreas = trpc.subscription.updateAreas.useMutation();
  const updateKeywords = trpc.subscription.updateKeywords.useMutation();
  const cancelSubscription = trpc.subscription.cancel.useMutation();

  useEffect(() => {
    if (status) {
      setSelectedAreas(status.areas);
      setCustomKeywords(status.customKeywords || "");
    }
  }, [status]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleToggleArea = (areaCode: string) => {
    setSelectedAreas(prev =>
      prev.includes(areaCode)
        ? prev.filter(a => a !== areaCode)
        : [...prev, areaCode]
    );
  };

  const handleSaveProfile = async () => {
    if (selectedAreas.length === 0) {
      toast.error("Debes seleccionar al menos un área de práctica");
      return;
    }

    setIsSaving(true);

    try {
      await updateAreas.mutateAsync({ areas: selectedAreas });
      await updateKeywords.mutateAsync({ keywords: customKeywords });
      
      toast.success("Perfil actualizado correctamente");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("¿Estás seguro de que deseas cancelar tu suscripción? Dejarás de recibir alertas.")) {
      return;
    }

    try {
      await cancelSubscription.mutateAsync();
      toast.success("Suscripción cancelada");
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Error al cancelar suscripción");
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
          <Button variant="outline" onClick={() => setLocation("/")}>
            ← Volver al inicio
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-12 px-4 max-w-4xl">
        {/* User Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
            <CardDescription>
              {user.email} • Suscripción: <span className="font-semibold capitalize">{status?.subscription?.status || "N/A"}</span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Practice Areas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Áreas de Práctica ({selectedAreas.length}/25)</CardTitle>
            <CardDescription>
              Selecciona las áreas sobre las que deseas recibir alertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRACTICE_AREA_CODES.map((code) => {
                const area = PRACTICE_AREAS[code];
                return (
                  <div key={code} className="flex items-start space-x-3">
                    <Checkbox
                      id={code}
                      checked={selectedAreas.includes(code)}
                      onCheckedChange={() => handleToggleArea(code)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={code}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {area.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {area.keywords.slice(0, 4).join(", ")}...
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Custom Keywords */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Keywords Personalizados</CardTitle>
            <CardDescription>
              Agrega términos adicionales separados por comas para refinar tus alertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ejemplo: NOM-035, outsourcing, reforma energética, USMCA"
              value={customKeywords}
              onChange={(e) => setCustomKeywords(e.target.value)}
              rows={4}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              Estos keywords se combinarán con las áreas seleccionadas para personalizar aún más tus alertas
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving || selectedAreas.length === 0}
            className="flex-1"
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelSubscription}
            disabled={cancelSubscription.isPending}
          >
            Cancelar Suscripción
          </Button>
        </div>
      </main>
    </div>
  );
}
