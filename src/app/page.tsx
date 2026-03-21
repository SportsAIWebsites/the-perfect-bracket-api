import { Suspense } from "react";
import { Header } from "@/components/ui/Header";
import { BracketPage } from "@/components/bracket/BracketPage";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-base">
      <Suspense
        fallback={
          <header className="border-b border-border-subtle bg-bg-base px-4 py-3 md:px-6">
            <h1 className="text-xl font-bold md:text-2xl">
              <span className="text-accent">The Perfect</span>{" "}
              <span className="text-text-primary">Bracket</span>
            </h1>
          </header>
        }
      >
        <Header />
        <BracketPage />
      </Suspense>
    </main>
  );
}
