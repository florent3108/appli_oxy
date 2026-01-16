import { ContactsManager } from "~/components/contacts-manager";
import { Navbar } from "~/components/navbar";

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      <ContactsManager />
    </main>
  );
}
