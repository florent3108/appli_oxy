import { MaintenanceManager } from "~/components/maintenance-manager";
import { Navbar } from "~/components/navbar";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-slate-950">
        <Navbar />
        <MaintenanceManager />
      </main>
    </HydrateClient>
  );
}
