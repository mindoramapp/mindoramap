import { Link, useNavigate } from "@tanstack/react-router";
import { MotionConfig, motion } from "framer-motion";
import { isLiteMode } from "@/lib/performance";
import { InstallAppButton } from "@/features/pwa/InstallInvitation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Download,
  FolderTree,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Mail,
  MoonStar,
  Network,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/store/auth";

const sectionFade = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const steps = [
  {
    title: "Escreva a ideia central",
    body: "Comece em branco ou por um modelo de estudo, brainstorm ou projeto.",
  },
  {
    title: "Puxe os ramos",
    body: "Tab cria um filho, Enter cria um irmão. No celular, um toque em “+ Filho”.",
  },
  {
    title: "Revise e compartilhe",
    body: "Estude o mapa com cartões de revisão ou exporte em imagem ou texto.",
  },
];

const features = [
  {
    icon: Network,
    title: "Árvore ou grafo",
    body: "Organização automática em árvore, ou posições livres com conexões entre ramos.",
  },
  {
    icon: GraduationCap,
    title: "Modo revisão",
    body: "Cada ramo vira um cartão de estudo, com revisão espaçada e o domínio do mapa em %.",
  },
  {
    icon: Layers3,
    title: "Submapas",
    body: "Aprofunde um tema num mapa próprio sem poluir o panorama principal.",
  },
  {
    icon: FolderTree,
    title: "Pastas e favoritos",
    body: "Separe mapas por assunto e deixe os mais usados a um clique.",
  },
  {
    icon: Download,
    title: "Exportação",
    body: "PNG, SVG, Markdown ou JSON para backup e para levar a outra conta.",
  },
  {
    icon: Smartphone,
    title: "No celular também",
    body: "Instale como app, edite com toque e continue de onde parou. Tudo é salvo sozinho.",
  },
];

const scrollToId = (id: string) => {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={sectionFade}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground backdrop-blur">
      <Sparkles size={12} />
      {children}
    </span>
  );
}

function QuickAccessCard() {
  const { login, configured, debugMessage } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || debugMessage || "Não foi possível entrar agora.");
      return;
    }

    const nextUser = useAuth.getState().user;
    navigate({
      to: nextUser?.role === "superadmin" || nextUser?.accessGranted ? "/dashboard" : "/activate",
    });
  };

  return (
    <div className="landing-panel relative overflow-hidden rounded-[28px] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Entrar</p>
          <p className="mt-1 text-xs text-muted-foreground">Continue de onde parou.</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MoonStar size={18} />
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-3 py-3 backdrop-blur transition-colors focus-within:border-primary/40">
          <Mail size={16} className="text-muted-foreground" />
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>

        <label className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-3 py-3 backdrop-blur transition-colors focus-within:border-primary/40">
          <LockKeyhole size={16} className="text-muted-foreground" />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>

        {error && (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!configured || submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-hero)] px-4 py-3 text-sm font-semibold text-primary-foreground transition duration-300 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Entrando..." : "Entrar"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between gap-2 text-sm">
        <Link
          to="/login"
          className="text-muted-foreground transition-colors hover:text-foreground pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
        >
          Esqueci minha senha
        </Link>
        <Link
          to="/register"
          className="font-medium text-primary hover:underline pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}

/** Where a signed-in visitor continues: their maps, or the invite screen if not activated yet. */
function useAppDestination() {
  const user = useAuth((state) => state.user);
  if (!user) return null;
  return user.role === "superadmin" || user.accessGranted ? "/dashboard" : "/activate";
}

function SignedInCard({ destination }: { destination: "/dashboard" | "/activate" }) {
  const name = useAuth((state) => state.user?.name);
  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-[var(--shadow-soft)] backdrop-blur">
      <p className="text-sm text-muted-foreground">
        Você já está conectado{name ? ` como ${name}` : ""}.
      </p>
      <Link
        to={destination}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-hero)] px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
      >
        {destination === "/dashboard" ? "Abrir meus mapas" : "Liberar meu acesso"}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export function LandingPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const appDestination = useAppDestination();
  // The 7 MB looping video is decorative: skip it on phones, low-end devices and data saver.
  const [showHeroVideo] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches &&
      !isLiteMode(),
  );
  const [lite] = useState(isLiteMode);

  const navItems = useMemo(
    () => [
      { label: "Como funciona", id: "como-funciona" },
      { label: "Recursos", id: "recursos" },
    ],
    [],
  );

  return (
    <MotionConfig reducedMotion={lite ? "always" : "user"}>
      <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <img
            src={`${import.meta.env.BASE_URL}hero-network-bg.jpg`}
            alt=""
            aria-hidden="true"
            className={`fixed inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              theme === "dark" ? "opacity-15" : "opacity-[0.18] contrast-125 saturate-125"
            } blur-[1px]`}
          />
          <div className="landing-orb left-[-18%] top-[2%] h-[26rem] w-[26rem] text-primary/25" />
          <div className="landing-orb right-[-16%] top-[20%] h-[28rem] w-[28rem] text-cyan-400/15" />
          <div className="landing-orb bottom-[-16%] left-[18%] h-[30rem] w-[30rem] text-emerald-400/15" />
          <div className="landing-grid absolute inset-0 opacity-60" />
        </div>

        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/72 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => scrollToId("top")}
              className="flex items-center gap-3 text-left"
              aria-label="Mindora — início"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-soft)]">
                <Network size={20} />
              </span>
              {/* Narrow phones keep only the logo so every header action fits. */}
              <div className="hidden min-[420px]:block">
                <div className="text-base font-semibold tracking-tight">Mindora</div>
                <div className="hidden text-xs text-muted-foreground sm:block">
                  Mapas mentais para estudar e planejar
                </div>
              </div>
            </button>

            <nav className="hidden items-center gap-6 lg:flex">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToId(item.id)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground pointer-coarse:py-3"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <InstallAppButton />
              <ThemeToggle />
              {appDestination ? (
                <Link
                  to={appDestination}
                  className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-hero)] px-4 py-2 text-sm font-semibold pointer-coarse:min-h-11 text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-95"
                >
                  Meus mapas
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-hero)] px-4 py-2 text-sm font-semibold pointer-coarse:min-h-11 text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-95"
                  >
                    Criar conta
                    <ChevronRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <main id="top">
          <section className="relative isolate overflow-hidden">
            <div className="absolute inset-0 -z-20">
              <img
                src={`${import.meta.env.BASE_URL}hero-network-bg.jpg`}
                alt=""
                aria-hidden="true"
                className={`h-full w-full object-cover transition-opacity duration-700 ${
                  theme === "dark" ? "opacity-75" : "opacity-65 contrast-120 saturate-125"
                }`}
              />
              {showHeroVideo && (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className={`absolute inset-0 h-full w-full object-cover ${
                    theme === "dark" ? "mix-blend-screen opacity-60" : "opacity-50"
                  }`}
                >
                  <source src={`${import.meta.env.BASE_URL}mindora-hero.mp4`} type="video/mp4" />
                </video>
              )}
            </div>
            <div
              className={`absolute inset-0 -z-10 ${
                theme === "dark"
                  ? "bg-[linear-gradient(180deg,rgba(9,12,19,0.40)_0%,rgba(9,12,19,0.78)_40%,rgba(9,12,19,0.98)_100%)]"
                  : "bg-[linear-gradient(180deg,rgba(248,249,252,0.15)_0%,rgba(248,249,252,0.45)_40%,rgba(248,249,252,0.92)_100%)]"
              }`}
            />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(110,114,255,0.20),transparent_35%),radial-gradient(circle_at_80%_16%,rgba(34,211,238,0.14),transparent_28%)]" />

            <div className="mx-auto grid min-h-[calc(100vh-4.75rem)] max-w-7xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:px-8 lg:py-20">
              <div className="flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="max-w-3xl"
                >
                  <SectionLabel>Mapas mentais</SectionLabel>
                  <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-balance text-foreground sm:text-6xl lg:text-7xl">
                    Organize ideias em mapas que você revisa e entende.
                  </h1>
                  <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    Monte mapas mentais em minutos, ligue assuntos relacionados e transforme o mapa
                    em cartões de revisão para estudar. No computador ou no celular.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.7 }}
                  className="mt-8 flex flex-col gap-3 sm:flex-row"
                >
                  <Link
                    to={appDestination ?? "/register"}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-hero)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-0.5 hover:opacity-95"
                  >
                    {appDestination ? "Abrir meus mapas" : "Começar agora"}
                    <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => scrollToId("como-funciona")}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card/50 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-card"
                  >
                    Como funciona
                    <ChevronRight size={16} />
                  </button>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 36 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.16, duration: 0.8 }}
                className="relative flex items-center"
              >
                {appDestination ? (
                  <SignedInCard destination={appDestination} />
                ) : (
                  <QuickAccessCard />
                )}
              </motion.div>
            </div>
          </section>

          <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-3xl text-center">
              <SectionLabel>Como funciona</SectionLabel>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Do primeiro balão ao mapa pronto em três passos.
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <Reveal key={step.title} delay={index * 0.06}>
                  <div className="landing-panel h-full rounded-[28px] p-6">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section id="recursos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-3xl text-center">
              <SectionLabel>Recursos</SectionLabel>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                O essencial à vista, o resto a um clique.
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Reveal key={feature.title} delay={index * 0.05}>
                    <div className="landing-panel h-full rounded-[28px] p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon size={20} />
                      </div>
                      <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
            <Reveal>
              <div className="landing-panel relative overflow-hidden rounded-[36px] p-8 sm:p-10 lg:p-14">
                <img
                  src={`${import.meta.env.BASE_URL}cta-constellation-bg.jpg`}
                  alt=""
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                    theme === "dark" ? "opacity-35" : "opacity-30 contrast-120 saturate-110"
                  }`}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.18),transparent_28%)]" />
                <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div>
                    <SectionLabel>Pronto para começar</SectionLabel>
                    <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                      Crie sua conta e monte o primeiro mapa hoje.
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                      É grátis para começar, no plano Free. Crie a conta, confirme o e-mail e
                      pronto: você já monta o primeiro mapa.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <Link
                      to={appDestination ?? "/register"}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-hero)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-95"
                    >
                      {appDestination ? "Abrir meus mapas" : "Criar conta"}
                      <ArrowRight size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/login" })}
                      className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background/60 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
                    >
                      Já tenho conta
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        </main>

        <footer className="border-t border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[image:var(--gradient-hero)] text-primary-foreground">
                <Network size={18} />
              </span>
              <div>
                <div className="text-sm font-semibold">Mindora</div>
                <div className="text-xs text-muted-foreground">
                  Mapas mentais para estudar e planejar
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
