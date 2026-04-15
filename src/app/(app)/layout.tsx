import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — solo desktop */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header con burger menu */}
        <Header />

        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-3xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* BottomNav — solo mobile */}
        <BottomNav />
      </div>
    </div>
  );
}
