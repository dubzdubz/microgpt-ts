export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-4xl font-bold">Next.js App Starter</h1>
      <p className="mb-8 text-muted-foreground">
        A clean starting point with Next.js, shadcn/ui, Tailwind v4, and
        Storybook.
      </p>
      <div className="flex gap-4 text-sm">
        <a
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          Next.js Docs
        </a>
        <a
          href="https://ui.shadcn.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          shadcn/ui
        </a>
        <a
          href="https://tailwindcss.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          Tailwind CSS
        </a>
      </div>
    </main>
  );
}
