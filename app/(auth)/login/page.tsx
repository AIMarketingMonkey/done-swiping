"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// ── Validation schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // ── Email/password sign-in ─────────────────────────────────────────────────

  async function onSubmit(values: LoginFormValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("invalid login")) {
        toast.error("Incorrect email or password. Please try again.");
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error(
          "Please check your inbox and confirm your email before signing in."
        );
      } else {
        toast.error(error.message ?? "Something went wrong. Please try again.");
      }
      return;
    }

    toast.success("Welcome back!");
    router.push("/home");
    router.refresh();
  }

  // ── OAuth placeholders ─────────────────────────────────────────────────────

  function handleGoogleSignIn() {
    setOauthLoading("google");
    // TODO: wire Supabase OAuth
    toast.info("Google sign-in coming soon.");
    setOauthLoading(null);
  }

  function handleAppleSignIn() {
    setOauthLoading("apple");
    // TODO: wire Supabase OAuth
    toast.info("Apple sign-in coming soon.");
    setOauthLoading(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-8">
      {/* Heading */}
      <div className="mb-7 text-center">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "oklch(0.18 0.04 270)" }}
        >
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: "oklch(0.55 0.02 50)" }}>
          Sign in to continue your journey
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="flex flex-col gap-3 mb-6">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={oauthLoading !== null || isSubmitting}
          aria-label="Sign in with Google"
          className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border font-medium text-sm transition-all hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            border: "1px solid oklch(0.88 0.012 50)",
            color: "oklch(0.18 0.04 270)",
          }}
        >
          {oauthLoading === "google" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={oauthLoading !== null || isSubmitting}
          aria-label="Sign in with Apple"
          className="flex items-center justify-center gap-3 w-full h-12 rounded-xl font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "oklch(0.18 0.04 270)", color: "white" }}
        >
          {oauthLoading === "apple" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <AppleIcon />
          )}
          Continue with Apple
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6" role="separator">
        <div
          className="flex-1 h-px"
          style={{ background: "oklch(0.92 0.012 50)" }}
        />
        <span className="text-xs font-medium" style={{ color: "oklch(0.65 0.02 50)" }}>
          or sign in with email
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "oklch(0.92 0.012 50)" }}
        />
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "oklch(0.18 0.04 270)" }}
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "oklch(0.65 0.02 50)" }}
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
              className="w-full h-12 pl-10 pr-4 rounded-xl border text-sm outline-none transition-all focus:ring-2"
              style={{
                border: errors.email
                  ? "1px solid oklch(0.6 0.16 22)"
                  : "1px solid oklch(0.88 0.012 50)",
                background: "oklch(0.99 0.006 60)",
                color: "oklch(0.18 0.04 270)",
              }}
            />
          </div>
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="text-xs mt-1.5"
              style={{ color: "oklch(0.6 0.16 22)" }}
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium"
              style={{ color: "oklch(0.18 0.04 270)" }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium transition-colors hover:underline"
              style={{ color: "oklch(0.6 0.16 22)" }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "oklch(0.65 0.02 50)" }}
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
              className="w-full h-12 pl-10 pr-11 rounded-xl border text-sm outline-none transition-all focus:ring-2"
              style={{
                border: errors.password
                  ? "1px solid oklch(0.6 0.16 22)"
                  : "1px solid oklch(0.88 0.012 50)",
                background: "oklch(0.99 0.006 60)",
                color: "oklch(0.18 0.04 270)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "oklch(0.65 0.02 50)" }}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="text-xs mt-1.5"
              style={{ color: "oklch(0.6 0.16 22)" }}
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full h-13 mt-1 rounded-xl font-semibold text-base"
          style={{
            background: "oklch(0.6 0.16 22)",
            boxShadow: "0 4px 16px oklch(0.6 0.16 22 / 0.35)",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Sign-up link */}
      <p
        className="mt-6 text-center text-sm"
        style={{ color: "oklch(0.55 0.02 50)" }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold transition-colors hover:underline"
          style={{ color: "oklch(0.6 0.16 22)" }}
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}

// ── Inline SVG icons for Google & Apple ──────────────────────────────────────

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.544 9.436c-.022-2.168 1.77-3.213 1.851-3.263-1.01-1.476-2.578-1.678-3.134-1.699-1.334-.136-2.613.786-3.29.786-.676 0-1.713-.768-2.822-.748C4.6 4.535 3.133 5.322 2.33 6.61.702 9.21 1.927 13.1 3.513 15.225c.793 1.138 1.729 2.41 2.961 2.365 1.19-.048 1.638-.763 3.077-.763 1.44 0 1.847.763 3.1.736 1.285-.022 2.094-1.154 2.876-2.298a11.6 11.6 0 0 0 1.309-2.655c-.03-.013-2.506-.965-2.53-3.174ZM11.322 2.95C11.971 2.156 12.41 1.07 12.284 0c-.923.04-2.074.624-2.743 1.402-.596.69-1.124 1.81-.983 2.874 1.04.08 2.106-.527 2.764-1.326Z" />
    </svg>
  );
}
