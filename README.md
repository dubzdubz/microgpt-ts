# microgpt-ts

A TypeScript port of Andrej Karpathy's [microgpt](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95) — a complete GPT built from scratch with **zero runtime dependencies**. Supports training and inference.

No PyTorch. No TensorFlow. Just TypeScript, and ~400 lines of code.

## What is this?

A character-level GPT that learns to generate human-like names. Everything is built from scratch: a `Value` class that tracks computations and backpropagates gradients through the chain rule, a GPT architecture (embeddings, attention, MLP, residual connections), and an Adam optimizer. Train it on ~32k names and generate new ones.


## Run

```
pnpm install
pnpm demo
```

Trains on ~32k names for 1000 steps (11s), then generates new ones:

```
num docs: 32033
vocab size: 27
chars: abcdefghijklmnopqrstuvwxyz
num params: 4192
step    1 / 1000 | loss 3.3075
step    2 / 1000 | loss 2.9965
step    3 / 1000 | loss 3.2289
step    4 / 1000 | loss 3.1194
step    5 / 1000 | loss 2.9776
step  201 / 1000 | loss 2.4461
step  401 / 1000 | loss 3.2390
step  601 / 1000 | loss 2.4860
step  801 / 1000 | loss 1.9760
training time: 11.06s

--- inference (new, hallucinated names) ---
sample  1: kadan
sample  2: alele
sample  3: rian
sample  4: kanani
sample  5: dahe
```

## Structure

```
scripts/demo.ts      — entry point: load data, train, generate
microgpt/value.ts    — Value autograd engine (forward + backward)
microgpt/model.ts    — GPT-2 architecture (embeddings, attention, MLP, inference)
microgpt/train.ts    — training loop with Adam optimizer
microgpt/utils.ts    — math helpers (sum, sample, gaussian, shuffle)
```

## Progression

The blog post describes building the model up in layers, one component at a time. This repo follows the same progression — each step is a separate PR:

| Step | What it adds | PR |
|------|--------------|----|
| train0 | Bigram count table — no neural net, no gradients | [#1](https://github.com/dubzdubz/microgpt-ts/pull/1) |
| train1 | MLP + manual gradients (numerical & analytic) + SGD | [#2](https://github.com/dubzdubz/microgpt-ts/pull/2) |
| train2 | Autograd (`Value` class) — replaces manual gradients | [#3](https://github.com/dubzdubz/microgpt-ts/pull/3) |
| train3 | Position embeddings + single-head attention + rmsnorm + residuals | [#4](https://github.com/dubzdubz/microgpt-ts/pull/4) |
| train4 | Multi-head attention + layer loop — full GPT architecture | [#5](https://github.com/dubzdubz/microgpt-ts/pull/5) |
| train5 | Adam optimizer | [#6](https://github.com/dubzdubz/microgpt-ts/pull/6) |

## Credits

Direct port of Karpathy's [microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95), which accompanies his blog post [*microgpt*](https://karpathy.github.io/2026/02/12/microgpt/). As he puts it:

> *The most atomic way to train and run inference for a GPT in pure, dependency-free Python. This file is the complete algorithm. Everything else is just efficiency.*
