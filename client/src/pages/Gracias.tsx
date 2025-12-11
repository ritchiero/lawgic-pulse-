export default function Gracias() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-card border border-border rounded-lg p-8 md:p-12 text-center shadow-sm">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¡Suscripción activada! 🎉
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Tu cuenta en Lawgic Pulse está lista. Recibirás un email de confirmación.
          </p>

          {/* What's Next */}
          <div className="bg-muted rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-foreground mb-4">¿Qué sigue?</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  <strong className="text-foreground">Mañana recibirás tu primer resumen diario</strong> con las publicaciones 
                  del DOF relevantes para tus áreas de práctica
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  <strong className="text-foreground">Cada viernes</strong> recibirás un resumen semanal con tesis, 
                  jurisprudencias y criterios relevantes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  Los emails llegarán <strong className="text-foreground">antes de las 8:00 AM</strong> (diarios) y 
                  <strong className="text-foreground"> 9:00 AM viernes</strong> (semanales)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  Puedes <strong className="text-foreground">cancelar cuando quieras</strong> desde el link en cualquier email
                </span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="flex gap-4 justify-center">
            <a
              href="/dashboard"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 font-medium transition-colors"
            >
              Ir a mi Dashboard →
            </a>
            <a
              href="/"
              className="inline-block text-muted-foreground hover:underline font-medium"
            >
              ← Volver al inicio
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            ¿Preguntas? Escríbenos a{" "}
            <a href="mailto:hola@lawgic.io" className="text-primary hover:underline">
              hola@lawgic.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
