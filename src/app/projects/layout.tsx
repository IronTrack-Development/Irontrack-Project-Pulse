import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — desktop */}
      <Sidebar />
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      {/* Mobile nav */}
      <MobileNav />
    </div>
  );
}
