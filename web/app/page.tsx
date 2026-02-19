import Link from "next/link";
import { HeroCta } from "@/components/hero-cta";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex max-w-xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
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
