// "Reenviar e-mail de confirmação" with a 60 s cooldown, so a new account that never got (or
// lost) the confirmation link always has a way forward. Used after signup and on the login.
import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";

const COOLDOWN_SECONDS = 60;

export function ResendConfirmation({
  email,
  className = "",
}: {
  email: string;
  className?: string;
}) {
  const resendConfirmation = useAuth((state) => state.resendConfirmation);
  const [wait, setWait] = useState(0);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const resend = async () => {
    setSending(true);
    setFeedback(null);
    const result = await resendConfirmation(email);
    setSending(false);
    setFeedback({
      ok: result.ok,
      text: result.ok
        ? "Enviamos de novo. Confira a caixa de entrada e o spam."
        : result.error || "",
    });
    if (result.ok) setWait(COOLDOWN_SECONDS);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void resend()}
        disabled={sending || wait > 0 || !email}
        className="w-full rounded-lg border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending
          ? "Enviando..."
          : wait > 0
            ? `Reenviar em ${wait} s`
            : "Reenviar e-mail de confirmação"}
      </button>
      {feedback && (
        <p
          className={`mt-2 text-center text-xs ${feedback.ok ? "text-emerald-600" : "text-destructive"}`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
