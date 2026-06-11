import Link from "next/link";
import { Heart } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell min-h-screen gradient-warm flex flex-col">
      {/* Top Logo Bar */}
      <header className="flex-shrink-0 flex items-center justify-center pt-10 pb-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="Done Swiping — home"
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-transform group-hover:scale-105"
            style={{ background: "oklch(0.6 0.16 22)" }}
          >
            <Heart className="w-5 h-5 text-white fill-white" aria-hidden="true" />
          </div>
          <span
            className="text-xl font-bold"
            style={{ color: "oklch(0.18 0.04 270)" }}
          >
            Done Swiping
          </span>
        </Link>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex flex-col items-stretch justify-start px-4 pb-10">
        <div
          className="w-full max-w-sm mx-auto rounded-3xl shadow-xl overflow-hidden"
          style={{
            background: "oklch(1 0 0)",
            boxShadow:
              "0 8px 40px oklch(0.18 0.04 270 / 0.12), 0 2px 8px oklch(0.18 0.04 270 / 0.06)",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
