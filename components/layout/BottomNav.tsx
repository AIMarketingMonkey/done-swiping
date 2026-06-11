"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, MessageCircle, User } from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card border-t border-border z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
                strokeWidth={isActive ? 2.5 : 1.8}
                aria-hidden="true"
              />
              <span
                className="text-[10px] font-medium transition-colors leading-none"
                style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
