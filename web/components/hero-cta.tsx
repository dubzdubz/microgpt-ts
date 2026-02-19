"use client";

import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroCta() {
  return (
    <div className="flex items-center gap-3">
      <Button
        size="lg"
        nativeButton={false}
        render={<Link href="/playground" />}
      >
        Open Playground
        <ArrowRight className="ml-2 size-4" />
      </Button>

      <Button
        variant="outline"
        size="lg"
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
        GitHub
      </Button>
    </div>
  );
}
