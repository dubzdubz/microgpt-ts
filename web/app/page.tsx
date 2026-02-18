import { TrainDemo } from "@/components/demo/demo";

export default function Page() {
  return (
    <main className="flex h-screen flex-col items-center overflow-hidden px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold">microgpt</h1>
      <p className="mb-10 text-muted-foreground">
        Train a tiny GPT on names and generate new ones — right in your browser.
      </p>
      <TrainDemo />
    </main>
  );
}
