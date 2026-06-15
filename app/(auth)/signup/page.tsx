"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Heart,
  Check,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// ── Validation schema ────────────────────────────────────────────────────────

const schema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include at least one uppercase letter")
      .regex(/[0-9]/, "Must include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    consent_terms: z
      .boolean()
      .refine((v) => v === true, "You must agree to the Terms of Service and Privacy Policy"),
    consent_age: z
      .boolean()
      .refine((v) => v === true, "You must confirm you are 18 or over"),
    consent_community: z
      .boolean()
      .refine((v) => v === true, "You must accept the Community Guidelines"),
    consent_ai: z
      .boolean()
      .refine(
        (v) => v === true,
        "You must consent to AI processing to use this service"
      ),
    consent_marketing: z.boolean().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

// ── Style helpers ─────────────────────────────────────────────────────────────

const inputBase =
  "w-full h-12 rounded-xl border text-sm outline-none transition-all focus:ring-2";
const inputStyle = (hasError: boolean) => ({
  border: hasError
    ? "1px solid oklch(0.6 0.16 22)"
    : "1px solid oklch(0.88 0.012 50)",
  background: "oklch(0.99 0.006 60)",
  color: "oklch(0.18 0.04 270)",
});
const labelStyle = { color: "oklch(0.18 0.04 270)" };
const errorStyle = { color: "oklch(0.6 0.16 22)" };
const mutedStyle = { color: "oklch(0.65 0.02 50)" };
const accentColor = "oklch(0.6 0.16 22)";

// ── Verification pending screen ───────────────────────────────────────────────

function VerificationPending({ email }: { email: string }) {
  const [resending, setResending] = useState(false);

  async function handleResend() {
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast.error("Could not resend. Please try again in a moment.");
    } else {
      toast.success("Verification email resent. Check your inbox.");
    }
    setResending(false);
  }

  return (
    <div className="px-6 py-10 flex flex-col items-center text-center gap-6 animate-fade-in-up">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "oklch(0.97 0.02 30)" }}
      >
        <MailCheck
          className="w-8 h-8"
          style={{ color: accentColor }}
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" style={labelStyle}>
          Check your inbox
        </h1>
        <p className="text-sm leading-relaxed" style={mutedStyle}>
          We have sent a verification link to{" "}
          <strong style={{ color: "oklch(0.18 0.04 270)" }}>{email}</strong>.
          Click it to activate your account and start talking to Sage.
        </p>
      </div>

      <div
        className="w-full rounded-2xl p-4 text-sm text-left"
        style={{
          background: "oklch(0.97 0.006 60)",
          border: "1px solid oklch(0.92 0.012 50)",
        }}
      >
        <p className="font-medium mb-1" style={labelStyle}>
          Can&apos;t find it?
        </p>
        <p style={mutedStyle}>
          Check your spam or junk folder. The link expires after 24 hours.
        </p>
      </div>

      <Button
        onClick={handleResend}
        disabled={resending}
        variant="outline"
        className="w-full h-12 rounded-xl font-medium"
        style={{ borderColor: "oklch(0.88 0.012 50)" }}
      >
        {resending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
            Resending…
          </>
        ) : (
          "Resend verification email"
        )}
      </Button>

      <p className="text-sm" style={mutedStyle}>
        Already verified?{" "}
        <Link
          href="/login"
          className="font-semibold hover:underline"
          style={{ color: accentColor }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ── Consent checkbox ──────────────────────────────────────────────────────────

function ConsentBox({
  id,
  checked,
  onChange,
  error,
  required = true,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer" htmlFor={id}>
        <div className="flex-shrink-0 mt-0.5">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div
            className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
            style={{
              background: checked ? accentColor : "oklch(0.99 0.006 60)",
              borderColor: error
                ? accentColor
                : checked
                ? accentColor
                : "oklch(0.88 0.012 50)",
            }}
            aria-hidden="true"
          >
            {checked && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
        <span className="text-xs leading-relaxed" style={mutedStyle}>
          {children}
          {!required && (
            <span className="ml-1" style={{ color: "oklch(0.75 0.02 50)" }}>
              (optional)
            </span>
          )}
        </span>
      </label>
      {error && (
        <p role="alert" className="text-xs mt-1.5 ml-8" style={errorStyle}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      consent_terms: false,
      consent_age: false,
      consent_community: false,
      consent_ai: false,
      consent_marketing: false,
    },
  });

  const [termsVal, ageVal, communityVal, aiVal, marketingVal] = watch([
    "consent_terms",
    "consent_age",
    "consent_community",
    "consent_ai",
    "consent_marketing",
  ]);

  if (pendingEmail) {
    return <VerificationPending email={pendingEmail} />;
  }

  async function onSubmit(values: FormValues) {
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth-callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        toast.error("That email is already registered. Try signing in instead.");
      } else {
        toast.error(error.message ?? "Something went wrong. Please try again.");
      }
      return;
    }

    setPendingEmail(values.email);
  }

  return (
    <div className="px-6 py-8">
      {/* Heading */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-1" style={labelStyle}>
          Create your account
        </h1>
        <p className="text-sm" style={mutedStyle}>
          It takes less than a minute. Sage does the rest.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1.5"
            style={labelStyle}
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={mutedStyle}
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
              className={`${inputBase} pl-10 pr-4`}
              style={inputStyle(!!errors.email)}
            />
          </div>
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1.5"
            style={labelStyle}
          >
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={mutedStyle}
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
              className={`${inputBase} pl-10 pr-11`}
              style={inputStyle(!!errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={mutedStyle}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1.5"
            style={labelStyle}
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={mutedStyle}
              aria-hidden="true"
            />
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
              {...register("confirmPassword")}
              className={`${inputBase} pl-10 pr-11`}
              style={inputStyle(!!errors.confirmPassword)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={mutedStyle}
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirm-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Consent section */}
        <div
          className="border-t pt-4 flex flex-col gap-3"
          style={{ borderColor: "oklch(0.92 0.012 50)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "oklch(0.55 0.02 50)" }}
          >
            Agreements
          </p>

          <ConsentBox
            id="consent_terms"
            checked={termsVal ?? false}
            onChange={(v) =>
              setValue("consent_terms", v, { shouldValidate: true })
            }
            error={errors.consent_terms?.message}
          >
            I have read and agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-medium hover:underline"
              style={{ color: accentColor }}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="font-medium hover:underline"
              style={{ color: accentColor }}
            >
              Privacy Policy
            </Link>
          </ConsentBox>

          <ConsentBox
            id="consent_age"
            checked={ageVal ?? false}
            onChange={(v) =>
              setValue("consent_age", v, { shouldValidate: true })
            }
            error={errors.consent_age?.message}
          >
            I confirm I am 18 years of age or over
          </ConsentBox>

          <ConsentBox
            id="consent_community"
            checked={communityVal ?? false}
            onChange={(v) =>
              setValue("consent_community", v, { shouldValidate: true })
            }
            error={errors.consent_community?.message}
          >
            I agree to the{" "}
            <Link
              href="/community-guidelines"
              target="_blank"
              className="font-medium hover:underline"
              style={{ color: accentColor }}
            >
              Community Guidelines
            </Link>
          </ConsentBox>

          <ConsentBox
            id="consent_ai"
            checked={aiVal ?? false}
            onChange={(v) =>
              setValue("consent_ai", v, { shouldValidate: true })
            }
            error={errors.consent_ai?.message}
          >
            I consent to Done Swiping processing my conversation data, including
            special-category personal data such as sexual orientation, using AI
            to build my compatibility profile. I understand this is how the
            matching service works.
          </ConsentBox>

          <ConsentBox
            id="consent_marketing"
            checked={marketingVal ?? false}
            onChange={(v) => setValue("consent_marketing", v)}
            required={false}
          >
            I would like to receive occasional updates and offers from Done
            Swiping by email
          </ConsentBox>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full h-13 mt-2 rounded-xl font-semibold text-base"
          style={{
            background: accentColor,
            boxShadow: "0 4px 16px oklch(0.6 0.16 22 / 0.35)",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
              Creating account…
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 fill-white mr-2" aria-hidden="true" />
              Create my account
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm" style={mutedStyle}>
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold hover:underline"
          style={{ color: accentColor }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
