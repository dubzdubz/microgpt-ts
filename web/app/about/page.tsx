import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-12">
      <article className="flex max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">About</h1>

          <p className="leading-relaxed text-muted-foreground">
            <code className="text-foreground/80">microgpt-ts</code> is a
            complete GPT built from scratch in TypeScript with zero runtime
            dependencies, inspired by Andrej Karpathy&apos;s{" "}
            <Link
              href="https://karpathy.github.io/2026/02/12/microgpt/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              microgpt
            </Link>
            . It implements a GPT-2-like architecture with a tokenizer, autograd
            engine, multi-head attention, and Adam optimizer. It includes
            training and inference loops in ~400 lines of readable code.
          </p>

          <p className="leading-relaxed text-muted-foreground">
            This is an educational project. The full source code is on{" "}
            <Link
              href="https://github.com/dubzdubz/microgpt-ts"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              GitHub
            </Link>
            , each implementation step is a separate pull request you can read
            through, and the{" "}
            <Link
              href="/playground"
              className="underline underline-offset-4 hover:text-foreground"
            >
              playground
            </Link>{" "}
            lets you train and run the model directly in your browser.
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">What&apos;s inside</h2>

          <ul className="list-inside list-disc space-y-2 leading-relaxed text-muted-foreground">
            <li>
              The <strong className="text-foreground/80">microgpt-ts</strong>{" "}
              library: a <code className="text-foreground/80">Value</code>{" "}
              autograd engine, GPT-2 architecture (embeddings, multi-head
              attention, MLP, residual connections, rmsnorm), and Adam optimizer
            </li>
            <li>
              A{" "}
              <strong className="text-foreground/80">browser playground</strong>{" "}
              where you can train the model and generate text with no install
              and no backend
            </li>
          </ul>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Learn step by step</h2>

          <p className="leading-relaxed text-muted-foreground">
            Following Karpathy&apos;s blog post, the model is built up one
            concept at a time. Each step introduces a new idea and is its own
            pull request, so you can follow the progression from a lookup table
            to a full GPT:
          </p>

          <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>
              <Link
                href="https://github.com/dubzdubz/microgpt-ts/pull/1"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Bigram count table
              </Link>{" "}
              — no neural net, no gradients
            </li>
            <li>
              <Link
                href="https://github.com/dubzdubz/microgpt-ts/pull/2"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                MLP + manual gradients + SGD
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/dubzdubz/microgpt-ts/pull/3"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Autograd
              </Link>{" "}
              — a <code className="text-foreground/80">Value</code> class that
              replaces manual gradients
            </li>
            <li>
              <Link
                href="https://github.com/dubzdubz/microgpt-ts/pull/4"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Single-head attention
              </Link>{" "}
              — position embeddings, rmsnorm, residual connections
            </li>
            <li>
              <Link
                href="https://github.com/dubzdubz/microgpt-ts/pull/5"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Multi-head attention + layer loop
              </Link>{" "}
              — full GPT architecture
            </li>
            <li>
              <Link
                href="https://github.com/dubzdubz/microgpt-ts/pull/6"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Adam optimizer
              </Link>
            </li>
          </ol>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">
            Differences from the original
          </h2>

          <p className="leading-relaxed text-muted-foreground">
            Karpathy&apos;s original microgpt is a single Python script
            optimized for brevity.{" "}
            <code className="text-foreground/80">microgpt-ts</code> takes a
            slightly different approach, prioritizing readability. The code is
            split into files and everything is typed. Math operations are broken
            out with helper functions like{" "}
            <code className="text-foreground/80">dotProduct</code>,{" "}
            <code className="text-foreground/80">transpose</code>, and{" "}
            <code className="text-foreground/80">mean</code>.
          </p>

          <p className="leading-relaxed text-muted-foreground">
            The result is a reusable library packaged as a module, not a
            standalone script. The playground imports it directly. And because
            it&apos;s TypeScript, it runs natively in the browser with no Python
            runtime or backend required.
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Credits</h2>

          <p className="leading-relaxed text-muted-foreground">
            Inspired by Andrej Karpathy&apos;s{" "}
            <Link
              href="https://karpathy.github.io/2026/02/12/microgpt/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              microgpt
            </Link>
            .
          </p>

          <p className="text-muted-foreground">
            Built by{" "}
            <Link
              href="https://github.com/dubzdubz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              @dubzdubz
            </Link>
            . Source on{" "}
            <Link
              href="https://github.com/dubzdubz/microgpt-ts"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              GitHub
            </Link>
            .
          </p>
        </div>
      </article>
    </main>
  );
}
