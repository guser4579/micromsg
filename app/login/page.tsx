"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setStep("code");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Success - redirect to home
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50">
      {/* Sticky full-width header */}
      <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/95">
        <div className="mx-auto flex h-14 max-w-none items-center justify-between px-4">
          <div className="text-sm font-medium">Micromsg</div>

          <button
            type="button"
            aria-label="Menu"
            className="inline-flex size-10 items-center justify-center rounded-md text-neutral-200 hover:bg-neutral-900 active:bg-neutral-800 cursor-pointer"
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </header>

      {/* Centered content column */}
      <main className="mx-auto max-w-[500px] px-4 pt-10 pb-40">
        <div className="mb-8">
          <p className="text-base text-neutral-50 leading-6 whitespace-pre-line">
            {step === "email"
              ? "Welcome to Micromsg - a very simple thought collector.\n\nEnter your email to begin."
              : "A verification code was sent to your email.\n\nEnter the code to authenticate."}
          </p>
        </div>
      </main>

      {/* Bottom cluster: fixed to bottom with safe area */}
      <div className="fixed left-0 right-0 z-30" style={{ bottom: "calc(40px + env(safe-area-inset-bottom))" }}>
        <div className="mx-auto max-w-[500px] px-4">
          {step === "email" ? (
            <form onSubmit={handleSendCode}>
              <div className="rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-2 min-h-[44px] flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  disabled={loading}
                  className="w-full bg-transparent text-base text-neutral-100 placeholder:text-neutral-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 text-center mt-3">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full text-center text-sm font-medium text-neutral-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? "Sending..." : "Submit"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <div className="rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-2 min-h-[44px] flex items-center">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.slice(0, 8))}
                  placeholder="Enter code"
                  required
                  maxLength={8}
                  disabled={loading}
                  className="w-full bg-transparent text-base text-neutral-100 placeholder:text-neutral-500 focus:outline-none disabled:opacity-50 text-center tracking-widest font-mono"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 text-center mt-3">{error}</p>
              )}
              <div className="flex flex-col items-center">
                <button
                  type="submit"
                  disabled={loading || code.length === 0}
                  className="text-center text-sm font-medium text-neutral-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? "Verifying..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError(null);
                  }}
                  disabled={loading}
                  className="text-center text-xs text-neutral-500 hover:text-neutral-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  Didn't receive the code? Try again
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
