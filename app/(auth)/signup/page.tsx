"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  User,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Heart,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// ── Validation schemas ────────────────────────────────────────────────────────

const step1Schema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name is too long"),
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
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const step2Schema = z.object({
  date_of_birth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => {
      const dob = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      return age >= 18 && age <= 100;
    }, "You must be at least 18 years old"),
  gender: z.enum(["man", "woman", "non-binary", "prefer_not_to_say"], {
    errorMap: () => ({ message: "Please select your gender" }),
  }),
  location: z
    .string()
    .min(2, "Please enter your city or town")
    .max(100, "Location is too long"),
  interested_in: z.enum(["men", "women", "everyone"], {
    errorMap: () => ({ message: "Please select who you're interested in" }),
  }),
  relationship_goal: z.enum(
    ["long-term", "casual", "open"],
    { errorMap: () => ({ message: "Please select your relationship intent" }) }
  ),
  terms_consent: z
    .boolean()
    .refine((v) => v === true, "You must agree to the terms to continue"),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

// ── Shared input style helpers ────────────────────────────────────────────────

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

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6" aria-label={`Step ${step} of 2`}>
      {[1, 2].map((n) => {
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-1.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: active
                  ? "oklch(0.6 0.16 22)"
                  : done
                  ? "oklch(0.6 0.16 22 / 0.15)"
                  : "oklch(0.94 0.006 60)",
                color: active
                  ? "white"
                  : done
                  ? "oklch(0.6 0.16 22)"
                  : "oklch(0.65 0.02 50)",
              }}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            {n < 2 && (
              <div
                className="w-10 h-0.5 rounded-full"
                style={{
                  background:
                    done ? "oklch(0.6 0.16 22)" : "oklch(0.92 0.012 50)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Select field ──────────────────────────────────────────────────────────────

function SelectField({
  id,
  label,
  value,
  onChange,
  error,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={labelStyle}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputBase} px-3.5 appearance-none`}
        style={inputStyle(!!error)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs mt-1.5" style={errorStyle}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Step 1 form ──────────────────────────────────────────────────────────

  const {
    register: reg1,
    handleSubmit: handleStep1,
    formState: { errors: e1, isSubmitting: submitting1 },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data ?? undefined,
  });

  // ── Step 2 form ──────────────────────────────────────────────────────────

  const {
    register: reg2,
    handleSubmit: handleStep2,
    setValue: setVal2,
    watch: watch2,
    formState: { errors: e2 },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      gender: undefined,
      interested_in: undefined,
      relationship_goal: undefined,
      terms_consent: false,
    },
  });

  const genderVal = watch2("gender") ?? "";
  const interestedVal = watch2("interested_in") ?? "";
  const goalVal = watch2("relationship_goal") ?? "";
  const termsVal = watch2("terms_consent");

  // ── Step 1 submit → advance to step 2 ───────────────────────────────────

  function onStep1(values: Step1Values) {
    setStep1Data(values);
    setStep(2);
    window.scrollTo({ top: 0 });
  }

  // ── Step 2 submit → create Supabase account ──────────────────────────────

  async function onStep2(values: Step2Values) {
    if (!step1Data) return;
    setIsSubmitting(true);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: step1Data.email,
      password: step1Data.password,
      options: {
        data: {
          name: step1Data.name,
          date_of_birth: values.date_of_birth,
          gender: values.gender,
          location: values.location,
          interested_in: values.interested_in,
          relationship_goal: values.relationship_goal,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered")) {
        toast.error("That email is already in use. Try signing in instead.");
      } else {
        toast.error(signUpError.message ?? "Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
      return;
    }

    // Insert the user row in the public.users table
    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        email: step1Data.email,
        name: step1Data.name,
        date_of_birth: values.date_of_birth,
        gender: values.gender,
        location: values.location,
        is_verified: false,
        is_blocked: false,
        subscription_status: "free",
        onboarding_completed: false,
        onboarding_step: "welcome",
      });

      await supabase.from("user_preferences").upsert({
        user_id: data.user.id,
        interested_in: values.interested_in,
        relationship_goal: values.relationship_goal,
        min_age: 18,
        max_age: 99,
        max_distance: 50,
      });
    }

    toast.success("Account created! Let's build your profile.");
    router.push("/welcome");
    router.refresh();
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-8">
      <StepIndicator step={step} />

      {step === 1 ? (
        <>
          {/* Step 1 heading */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1" style={labelStyle}>
              Create your account
            </h1>
            <p className="text-sm" style={mutedStyle}>
              Step 1 of 2 — Account details
            </p>
          </div>

          <form onSubmit={handleStep1(onStep1)} noValidate className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={labelStyle}>
                Full name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={mutedStyle}
                  aria-hidden="true"
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your first name (or nickname)"
                  aria-invalid={!!e1.name}
                  aria-describedby={e1.name ? "name-error" : undefined}
                  {...reg1("name")}
                  className={`${inputBase} pl-10 pr-4`}
                  style={inputStyle(!!e1.name)}
                />
              </div>
              {e1.name && (
                <p id="name-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
                  {e1.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={labelStyle}>
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
                  aria-invalid={!!e1.email}
                  aria-describedby={e1.email ? "email-error" : undefined}
                  {...reg1("email")}
                  className={`${inputBase} pl-10 pr-4`}
                  style={inputStyle(!!e1.email)}
                />
              </div>
              {e1.email && (
                <p id="email-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
                  {e1.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={labelStyle}>
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
                  aria-invalid={!!e1.password}
                  aria-describedby={e1.password ? "password-error" : undefined}
                  {...reg1("password")}
                  className={`${inputBase} pl-10 pr-11`}
                  style={inputStyle(!!e1.password)}
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
              {e1.password && (
                <p id="password-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
                  {e1.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={labelStyle}>
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
                  aria-invalid={!!e1.confirmPassword}
                  aria-describedby={e1.confirmPassword ? "confirm-error" : undefined}
                  {...reg1("confirmPassword")}
                  className={`${inputBase} pl-10 pr-11`}
                  style={inputStyle(!!e1.confirmPassword)}
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
              {e1.confirmPassword && (
                <p id="confirm-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
                  {e1.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting1}
              className="w-full h-13 mt-2 rounded-xl font-semibold text-base"
              style={{
                background: "oklch(0.6 0.16 22)",
                boxShadow: "0 4px 16px oklch(0.6 0.16 22 / 0.35)",
              }}
            >
              {submitting1 ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Continuing…
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        </>
      ) : (
        <>
          {/* Step 2 heading */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1" style={labelStyle}>
              About you
            </h1>
            <p className="text-sm" style={mutedStyle}>
              Step 2 of 2 — Help us find your match
            </p>
          </div>

          <form onSubmit={handleStep2(onStep2)} noValidate className="flex flex-col gap-4">
            {/* Date of birth */}
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium mb-1.5" style={labelStyle}>
                Date of birth
              </label>
              <input
                id="date_of_birth"
                type="date"
                aria-invalid={!!e2.date_of_birth}
                aria-describedby={e2.date_of_birth ? "dob-error" : undefined}
                {...reg2("date_of_birth")}
                className={`${inputBase} px-3.5`}
                style={inputStyle(!!e2.date_of_birth)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split("T")[0]}
              />
              {e2.date_of_birth && (
                <p id="dob-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
                  {e2.date_of_birth.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <SelectField
              id="gender"
              label="I identify as"
              value={genderVal}
              onChange={(v) =>
                setVal2("gender", v as Step2Values["gender"], {
                  shouldValidate: true,
                })
              }
              error={e2.gender?.message}
              placeholder="Select gender"
              options={[
                { value: "man", label: "Man" },
                { value: "woman", label: "Woman" },
                { value: "non-binary", label: "Non-binary" },
                { value: "prefer_not_to_say", label: "Prefer not to say" },
              ]}
            />

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1.5" style={labelStyle}>
                Your location
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={mutedStyle}
                  aria-hidden="true"
                />
                <input
                  id="location"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="City, State / Country"
                  aria-invalid={!!e2.location}
                  aria-describedby={e2.location ? "location-error" : undefined}
                  {...reg2("location")}
                  className={`${inputBase} pl-10 pr-4`}
                  style={inputStyle(!!e2.location)}
                />
              </div>
              {e2.location && (
                <p id="location-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
                  {e2.location.message}
                </p>
              )}
            </div>

            {/* Interested in */}
            <SelectField
              id="interested_in"
              label="I'm interested in"
              value={interestedVal}
              onChange={(v) =>
                setVal2("interested_in", v as Step2Values["interested_in"], {
                  shouldValidate: true,
                })
              }
              error={e2.interested_in?.message}
              placeholder="Select preference"
              options={[
                { value: "men", label: "Men" },
                { value: "women", label: "Women" },
                { value: "everyone", label: "Everyone" },
              ]}
            />

            {/* Relationship goal */}
            <SelectField
              id="relationship_goal"
              label="I'm looking for"
              value={goalVal}
              onChange={(v) =>
                setVal2(
                  "relationship_goal",
                  v as Step2Values["relationship_goal"],
                  { shouldValidate: true }
                )
              }
              error={e2.relationship_goal?.message}
              placeholder="Select intent"
              options={[
                { value: "long-term", label: "A long-term relationship" },
                { value: "casual", label: "Casual dating" },
                { value: "open", label: "Open to anything" },
              ]}
            />

            {/* Terms + AI consent checkbox */}
            <div className="mt-1">
              <label
                className="flex items-start gap-3 cursor-pointer group"
                htmlFor="terms_consent"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    id="terms_consent"
                    type="checkbox"
                    aria-invalid={!!e2.terms_consent}
                    aria-describedby={e2.terms_consent ? "terms-error" : undefined}
                    {...reg2("terms_consent")}
                    className="sr-only"
                  />
                  <div
                    className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                    style={{
                      background: termsVal
                        ? "oklch(0.6 0.16 22)"
                        : "oklch(0.99 0.006 60)",
                      borderColor: e2.terms_consent
                        ? "oklch(0.6 0.16 22)"
                        : termsVal
                        ? "oklch(0.6 0.16 22)"
                        : "oklch(0.88 0.012 50)",
                    }}
                    aria-hidden="true"
                  >
                    {termsVal && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <span className="text-xs leading-relaxed" style={mutedStyle}>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-medium hover:underline"
                    style={{ color: "oklch(0.6 0.16 22)" }}
                    target="_blank"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-medium hover:underline"
                    style={{ color: "oklch(0.6 0.16 22)" }}
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                  , and I consent to my profile being processed by AI to improve
                  compatibility matching.
                </span>
              </label>
              {e2.terms_consent && (
                <p id="terms-error" role="alert" className="text-xs mt-1.5" style={errorStyle}>
                  {e2.terms_consent.message}
                </p>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                aria-label="Go back to step 1"
                className="flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl border font-medium text-sm transition-all hover:bg-muted disabled:opacity-50"
                style={{
                  border: "1px solid oklch(0.88 0.012 50)",
                  color: "oklch(0.18 0.04 270)",
                }}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Back
              </button>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl font-semibold text-base"
                style={{
                  background: "oklch(0.6 0.16 22)",
                  boxShadow: "0 4px 16px oklch(0.6 0.16 22 / 0.35)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Creating account…
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" aria-hidden="true" />
                    Create my profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </>
      )}

      {/* Sign-in link (only on step 1) */}
      {step === 1 && (
        <p className="mt-6 text-center text-sm" style={mutedStyle}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold transition-colors hover:underline"
            style={{ color: "oklch(0.6 0.16 22)" }}
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
