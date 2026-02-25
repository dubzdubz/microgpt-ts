"use client";

import { Github } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type TabId = "dataset" | "train" | "generate";
const DEMO_TABS: { id: TabId; label: string }[] = [
  { id: "dataset", label: "Dataset" },
  { id: "train", label: "Train" },
  { id: "generate", label: "Generate" },
];

function DemoNavTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  if (pathname !== "/playground") return null;

  const activeTab = (searchParams.get("tab") ?? "dataset") as TabId;

  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-muted p-[3px] text-muted-foreground">
      {DEMO_TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => router.replace(`${pathname}?tab=${id}`)}
          className={cn(
            "inline-flex h-[calc(100%-1px)] items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all",
            activeTab === id
              ? "bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30 dark:text-foreground"
              : "text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <header>
      <nav className="relative flex items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          microgpt
        </Link>
        <div className="pointer-events-none absolute inset-x-0 hidden md:flex justify-center">
          <div className="pointer-events-auto">
            <Suspense>
              <DemoNavTabs />
            </Suspense>
          </div>
        </div>
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
                rel="noopener"
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
      {pathname === "/playground" && (
        <div className="flex justify-center pb-2 md:hidden">
          <Suspense>
            <DemoNavTabs />
          </Suspense>
        </div>
      )}
      <Separator />
    </header>
  );
}
