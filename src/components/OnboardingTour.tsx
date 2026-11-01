// First-time interactive onboarding tour for the mind map editor
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, GitBranch, Layers, MousePointer2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { markOnboardingDone } from "@/lib/onboarding";

interface TourStep {
  icon: React.ReactNode;
  title: string;
  body: string;
  highlight?: string;
  placement?: "center" | "below-header";
  extra?: React.ReactNode;
}

// Three short steps: write, grow, find the tools. Everything else is discovered in place.
const STEPS: TourStep[] = [
  {
    icon: <Sparkles size={20} />,
    title: "Bem-vindo ao Mindora!",
    body: "O balão do centro é a ideia principal do mapa. Dê um duplo clique nele para escrever.",
    placement: "center",
    extra: (
      <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-border bg-muted px-3 py-2 text-xs font-medium text-foreground">
        <MousePointer2 size={13} className="text-primary" />
        Duplo clique para editar
      </div>
    ),
  },
  {
    icon: <GitBranch size={20} />,
    title: "Adicione ideias",
    body: "Selecione um balão e crie ideias ligadas a ele. No celular, use os botões “+ Filho” e “+ Irmão” na parte de baixo.",
    placement: "center",
    extra: (
      <div className="mt-4 space-y-2">
        {[
          { key: "Tab", desc: "cria um balão filho" },
          { key: "Enter", desc: "cria um balão irmão" },
          { key: "Del", desc: "remove o balão selecionado" },
          { key: "Ctrl+Z", desc: "desfaz a última ação" },
        ].map(({ key, desc }) => (
          <div key={key} className="flex items-center gap-2.5 text-xs">
            <kbd className="min-w-[52px] rounded-lg border border-border bg-muted px-2 py-1 text-center font-semibold text-foreground shadow-sm">
              {key}
            </kbd>
            <span className="text-muted-foreground">{desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <Layers size={20} />,
    title: "Suas ferramentas",
    body: "Nesta barra você desfaz, alterna entre Árvore e Grafo, conecta ideias, organiza e muda as cores. Exportar, painéis e atalhos ficam no menu ⋯ do topo.",
    highlight: '[aria-label="Ferramentas do mapa"]',
    placement: "below-header",
    extra: (
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2.5 text-xs text-primary">
        <Check size={14} className="shrink-0" />
        <span>Tudo é salvo sozinho. O estado aparece ao lado do nome do mapa.</span>
      </div>
    ),
  },
];

interface Props {
  userId: string;
  onDone: () => void;
}

export function OnboardingTour({ userId, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  const current = STEPS[step];

  useEffect(() => {
    if (!current.highlight) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(current.highlight);
    if (el) setSpotlightRect(el.getBoundingClientRect());
    else setSpotlightRect(null);
  }, [step, current.highlight]);

  const finish = () => {
    markOnboardingDone(userId);
    setMounted(false);
    window.setTimeout(onDone, 300);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const isLast = step === STEPS.length - 1;

  const cardClass = cn(
    "absolute z-[51] w-[380px] max-w-[calc(100vw-32px)] rounded-3xl border border-border/60 bg-card p-6 shadow-2xl",
    "transition duration-300",
    current.placement === "below-header"
      ? "left-1/2 -translate-x-1/2 top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto"
      : "left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 max-h-[calc(100dvh-2rem)] overflow-y-auto",
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-300",
        mounted ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Overlay */}
      {spotlightRect ? (
        <>
          {/* Spotlight via box-shadow trick */}
          <div
            className="pointer-events-none fixed rounded-2xl ring-2 ring-primary transition duration-500"
            style={{
              left: spotlightRect.left - 6,
              top: spotlightRect.top - 6,
              width: spotlightRect.width + 12,
              height: spotlightRect.height + 12,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Tour card */}
      <div ref={cardRef} className={cardClass}>
        {/* Progress dots */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition duration-300",
                  i === step
                    ? "w-6 bg-primary"
                    : i < step
                      ? "w-1.5 bg-primary/50"
                      : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={finish}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Pular tour"
          >
            <X size={15} />
          </button>
        </div>

        {/* Icon */}
        <div className="mb-4 inline-grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-hero)] text-primary-foreground shadow-lg">
          {current.icon}
        </div>

        {/* Content */}
        <h3 className="mb-1.5 text-base font-semibold tracking-tight">{current.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{current.body}</p>
        {current.extra}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pular
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-hero)] px-5 py-2 text-sm font-medium text-primary-foreground shadow transition-opacity hover:opacity-90"
          >
            {isLast ? "Começar!" : "Próximo"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
