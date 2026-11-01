// Where the password recovery e-mail lands: the link already signed the person in (see
// __root.tsx), so here they only choose the new password.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Brain, LockKeyhole } from "lucide-react";
import { PASSWORD_MIN_LENGTH } from "@/lib/security";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha - Mindora" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { user, initialized, init, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("As duas senhas não são iguais.");
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Não foi possível alterar a senha.");
      return;
    }
    toast.success("Senha alterada. Você já está conectado.");
    const nextUser = useAuth.getState().user;
    navigate({
      to: nextUser?.role === "superadmin" || nextUser?.accessGranted ? "/dashboard" : "/activate",
    });
  };

  if (!initialized) return null;

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground">
            <Brain />
          </span>
          <h1 className="text-2xl font-bold">Criar nova senha</h1>
        </div>

        {!user ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Este link de recuperação expirou ou já foi usado. Peça um novo na tela de login, em
              “Esqueci minha senha”.
            </p>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[image:var(--gradient-hero)] py-2.5 font-medium text-primary-foreground"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Conta: <strong className="text-foreground">{user.email}</strong>
            </p>
            <label
              htmlFor="new-password"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <LockKeyhole size={12} /> Nova senha
            </label>
            <input
              id="new-password"
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
            <label
              htmlFor="confirm-password"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <LockKeyhole size={12} /> Repita a nova senha
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de {PASSWORD_MIN_LENGTH} caracteres com maiúscula, minúscula e número.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              disabled={submitting}
              className="w-full rounded-lg bg-[image:var(--gradient-hero)] py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {submitting ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
