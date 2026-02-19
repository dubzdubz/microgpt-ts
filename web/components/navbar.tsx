"use client";

import { Github } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Navbar() {
  return (
    <header>
      <nav className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          microgpt
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="GitHub"
            nativeButton={false}
            render={
              // biome-ignore lint/a11y/useAnchorContent: children injected by Base UI render prop
              <a
                href="https://github.com/dubzdubz/microgpt-ts"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Github className="size-4" />
          </Button>
          <Link
            href="/playground"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Playground
          </Link>
          <Link
            href="/about"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
        </div>
      </nav>
      <Separator />
    </header>
  );
}
