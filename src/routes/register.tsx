import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/store/auth";
import { ArrowLeft, Brain, Eye, EyeOff, MailCheck } from "lucide-react";
import { ResendConfirmation } from "@/components/ResendConfirmation";
import { PASSWORD_MIN_LENGTH, validatePasswordPolicy } from "@/lib/security";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Cadastro - Mindora" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { user, initialized, configured, configError, debugMessage, register, init } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debug, setDebug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Set once the account exists but still needs the e-mail link: the form becomes "confira seu e-mail".
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    if (!user) return;
    navigate({ to: user.role === "superadmin" || user.accessGranted ? "/dashboard" : "/activate" });
  }, [initialized, navigate, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDebug("");
    const passwordPolicyError = validatePasswordPolicy(password);
    if (passwordPolicyError) {
      setError(passwordPolicyError);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    const result = await register(name, email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || "Erro");
      setDebug(result.debug || debugMessage || "");
      return;
    }

    const nextUser = useAuth.getState().user;
    if (nextUser) {
      navigate({
        to: nextUser.role === "superadmin" || nextUser.accessGranted ? "/dashboard" : "/activate",
      });
      return;
    }
    setSentTo(email.trim().toLowerCase());
  };

  if (!initialized) return null;

  return (
    <div className="relative min-h-dvh grid place-items-center px-4 bg-[radial-gradient(ellipse_at_top,oklch(0.58_0.17_258/0.15),transparent_60%)]">
      <div className="absolute right-4 top-4">
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
          >
            <ArrowLeft size={16} />
            Voltar para a página inicial
          </Link>
        </div>
        {sentTo ? (
          <div className="space-y-4 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <MailCheck />
            </span>
            <h1 className="text-2xl font-bold">Confira seu e-mail</h1>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de confirmação para{" "}
              <strong className="break-all text-foreground">{sentTo}</strong>. Abra o e-mail e
              clique no link para ativar a conta. Depois é só entrar.
            </p>
            <p className="text-xs text-muted-foreground">
              Não chegou em alguns minutos? Veja a pasta de spam ou peça de novo.
            </p>
            <ResendConfirmation email={sentTo} />
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[image:var(--gradient-hero)] py-2.5 font-medium text-primary-foreground"
            >
              Já confirmei, quero entrar
            </Link>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="text-sm text-muted-foreground hover:text-foreground pointer-coarse:min-h-11"
            >
              Errei o e-mail, voltar
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 mb-6">
              <span className="w-12 h-12 rounded-xl bg-[image:var(--gradient-hero)] grid place-items-center text-primary-foreground">
                <Brain />
              </span>
              <h1 className="text-2xl font-bold">Criar conta</h1>
              <p className="text-sm text-muted-foreground text-center">
                É grátis. Depois, é só confirmar o e-mail e começar.
              </p>
            </div>
            {!configured && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {configError || "Auth não configurado."}
              </div>
            )}
            <form onSubmit={submit} className="space-y-3">
              <label htmlFor="register-name" className="text-xs text-muted-foreground">
                Seu nome
              </label>
              <input
                id="register-name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como quer ser chamado"
                className="w-full px-3 py-2.5 rounded-lg bg-input border border-border outline-none focus:ring-2 focus:ring-ring"
              />
              <label htmlFor="register-email" className="text-xs text-muted-foreground">
                E-mail
              </label>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full px-3 py-2.5 rounded-lg bg-input border border-border outline-none focus:ring-2 focus:ring-ring"
              />
              <label htmlFor="register-password" className="text-xs text-muted-foreground">
                Senha
              </label>
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crie uma senha"
                className="w-full px-3 py-2.5 rounded-lg bg-input border border-border outline-none focus:ring-2 focus:ring-ring"
              />
              <label htmlFor="register-confirm" className="text-xs text-muted-foreground">
                Repita a senha
              </label>
              <div className="relative">
                <input
                  id="register-confirm"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha de novo"
                  className="w-full px-3 py-2.5 pr-11 rounded-lg bg-input border border-border outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo de {PASSWORD_MIN_LENGTH} caracteres com maiúscula, minúscula e número.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {import.meta.env.DEV && debug && (
                <p className="text-xs text-amber-600 break-words rounded-md bg-amber-500/10 px-2 py-1">
                  Debug: {debug}
                </p>
              )}
              <button
                disabled={submitting || !configured}
                className="w-full py-2.5 rounded-lg bg-[image:var(--gradient-hero)] text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Criando..." : "Criar conta"}
              </button>
            </form>
          </>
        )}
        {!sentTo && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Já tem conta?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
            >
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
