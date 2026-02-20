# microgpt-ts

A TypeScript port of Andrej Karpathy's [microgpt](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95) — a complete GPT built from scratch with **zero runtime dependencies**. Supports training and inference.

No PyTorch. No TensorFlow. Just TypeScript, ~400 lines of code. Runs in the browser.

**Try the live playground: [microgpt-ts.vercel.app](https://microgpt-ts.vercel.app/)**

## What is this?

A character-level GPT that learns to generate text. Everything is built from scratch: a `Value` class that tracks computations and backpropagates gradients through the chain rule, a GPT architecture (embeddings, multi-head attention, MLP, residual connections, RMSNorm), and an Adam optimizer. Train it on ~32k names and watch it generate new ones.

## Getting Started

**Prerequisites:** [Node.js](https://nodejs.org/) (v20+) and [pnpm](https://pnpm.io/)

### CLI demo

```bash
pnpm install
pnpm demo
```

Trains on ~32k names for 1000 steps, then generates new ones:

```
num docs: 32033
vocab size: 27
chars: abcdefghijklmnopqrstuvwxyz
num params: 4192
step    1 / 1000 | loss 3.3075
step    2 / 1000 | loss 2.9965
step    3 / 1000 | loss 3.2289
...
step  801 / 1000 | loss 1.9760
training time: 11.06s

--- inference (new, hallucinated names) ---
sample  1: kadan
sample  2: alele
sample  3: rian
sample  4: kanani
sample  5: dahe
```

### Web playground

An interactive browser playground that trains and runs the GPT entirely client-side — no server needed.

```bash
cd web
pnpm install
pnpm dev
```

Head to `localhost:3000/playground` to train a model and generate text in real time, or use the hosted version at [microgpt-ts.vercel.app](https://microgpt-ts.vercel.app/playground).

Features:

- **Preset datasets** — baby names, Pokemon, cocktails, movie titles, fortunes, and more
- **Custom data** — paste or upload your own text
- **Configurable architecture** — adjust embedding size, attention heads, layers, and block size
- **Live training** — real-time loss charts and sample generation as the model trains
- **Token-level inference** — step through generation one token at a time with probability distributions
- **Temperature control** — adjust sampling randomness during generation
- **Prefix conditioning** — seed generation with a starting string

## Project Structure

```
microgpt/                  Core library (~400 lines, zero dependencies)
  value.ts                   Autograd engine (forward + backward via chain rule)
  model.ts                   GPT architecture (embeddings, attention, MLP, inference)
  train.ts                   Training loop with Adam optimizer
  utils.ts                   Math helpers (softmax, sampling, matrix ops)
  browser.ts                 Browser runtime (async training, Web Workers, serialization)
datasets/                  Preset training datasets (baby names, pokemon, cocktails, ...)
scripts/demo.ts            CLI entry point: load data, train, generate
web/                       Next.js interactive playground
```

## Progression

The [blog post](https://karpathy.github.io/2026/02/12/microgpt/) describes building the model up in layers, one component at a time. This repo follows the same progression — each step is a separate PR:

| Step | What it adds | PR |
|------|--------------|----|
| train0 | Bigram count table — no neural net, no gradients | [#1](https://github.com/dubzdubz/microgpt-ts/pull/1) |
| train1 | MLP + manual gradients (numerical & analytic) + SGD | [#2](https://github.com/dubzdubz/microgpt-ts/pull/2) |
| train2 | Autograd (`Value` class) — replaces manual gradients | [#3](https://github.com/dubzdubz/microgpt-ts/pull/3) |
| train3 | Position embeddings + single-head attention + RMSNorm + residuals | [#4](https://github.com/dubzdubz/microgpt-ts/pull/4) |
| train4 | Multi-head attention + layer loop — full GPT architecture | [#5](https://github.com/dubzdubz/microgpt-ts/pull/5) |
| train5 | Adam optimizer | [#6](https://github.com/dubzdubz/microgpt-ts/pull/6) |

Each step is also tagged (`step-1-bigram` through `step-6-microgpt-completed`) so you can checkout any snapshot directly: `git checkout step-2-mlp`.

## Development

Scripts from the repo root:

```bash
pnpm demo          # Run CLI demo (train + generate)
pnpm dev           # Start web dev server (localhost:3000)
pnpm build:web     # Production build
pnpm storybook     # Component stories (localhost:6006)
pnpm lint          # Check with Biome
pnpm lint:fix      # Auto-fix with Biome
```

The web app uses Next.js 16, shadcn/ui, Tailwind CSS v4, and Biome for linting/formatting. See [`AGENTS.md`](AGENTS.md) for coding conventions.

## Credits

Direct port of Karpathy's [microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95), which accompanies his blog post [*microgpt*](https://karpathy.github.io/2026/02/12/microgpt/). As he puts it:

> *The most atomic way to train and run inference for a GPT in pure, dependency-free Python. This file is the complete algorithm. Everything else is just efficiency.*
