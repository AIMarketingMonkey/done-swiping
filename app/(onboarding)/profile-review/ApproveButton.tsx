"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApproveButton() {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);

  async function handleApprove() {
    setIsApproving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to approve profile (${res.status})`);
      }

      toast.success("Profile approved! Welcome to Done Swiping 🎉");
      router.push("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not approve profile.");
      setIsApproving(false);
    }
  }

  return (
    <Button
      size="lg"
      disabled={isApproving}
      onClick={handleApprove}
      className="w-full h-14 rounded-2xl font-semibold text-base gap-2"
      style={{
        background: "oklch(0.6 0.16 22)",
        boxShadow: "0 4px 20px oklch(0.6 0.16 22 / 0.38)",
      }}
    >
      {isApproving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Approving…
        </>
      ) : (
        <>
          Approve my profile
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </>
      )}
    </Button>
  );
}
