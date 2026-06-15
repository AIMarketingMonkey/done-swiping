import Link from "next/link";
import { Heart, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="app-shell flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <WifiOff className="h-9 w-9 text-primary" aria-hidden="true" />
      </div>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
        Done Swiping
      </p>
      <h1 className="text-3xl font-bold text-foreground">You are offline</h1>
      <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
        Sage needs an internet connection for voice conversations. Reconnect,
        then try again.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
      >
        Try again
      </Link>
    </main>
  );
}
