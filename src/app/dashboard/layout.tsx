import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-64 p-4 md:p-6 lg:p-8 max-w-[1440px] pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
