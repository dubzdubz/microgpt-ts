import Link from "next/link";
import { DottedGlowBackground } from "@/components/aceternity/dotted-glow-background";
import { HeroCta } from "@/components/hero-cta";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6">
      <DottedGlowBackground
        className="pointer-events-none"
        opacity={0.7}
        gap={14}
        radius={1.4}
        colorLightVar="--color-neutral-400"
        glowColorLightVar="--color-neutral-500"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-700"
        speedMin={0.3}
        speedMax={1.2}
        speedScale={0.8}
      />

      {/* Radial fade: clears the center for readable text */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_50%_45%_at_50%_50%,var(--color-background)_60%,transparent_100%)]" />

      <div className="relative z-10 flex max-w-xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          microgpt-ts
        </h1>

        <p className="text-lg text-muted-foreground">
          A complete GPT built from scratch in TypeScript. Zero dependencies.
          Runs directly in your browser.
        </p>

        <Separator className="w-24" />

        <p className="text-sm leading-relaxed text-muted-foreground">
          GPT-2-like architecture with tokenizer, autograd, multi-head
          attention, and Adam optimizer. Training &amp; inference in ~400 lines
          of readable code. Train a model and generate text right here in your
          browser.
        </p>

        <p className="text-xs text-muted-foreground/60">
          Inspired by Andrej Karpathy&apos;s{" "}
          <Link
            href="https://karpathy.github.io/2026/02/12/microgpt/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-muted-foreground"
          >
            microgpt
          </Link>
        </p>

        <HeroCta />
      </div>
    </main>
  );
}
