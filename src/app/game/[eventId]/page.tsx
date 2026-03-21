import { Suspense } from "react";
import { Header } from "@/components/ui/Header";
import { GameDashboard } from "@/components/game/GameDashboard";

export default function GamePage({
  params,
}: {
  params: { eventId: string };
}) {
  return (
    <main className="min-h-screen bg-bg-base">
      <Suspense
        fallback={
          <header className="border-b border-border-subtle bg-bg-base px-4 py-3">
            <h1 className="text-xl font-bold">
              <span className="text-accent">The Perfect</span> Bracket
            </h1>
          </header>
        }
      >
        <Header />
        <GameDashboard eventId={params.eventId} />
      </Suspense>
    </main>
  );
}
