import DashboardSidebar from "@/components/DashboardSidebar";

export const metadata = {
  title: "Dashboard — NFTX",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="db-layout">
      <DashboardSidebar />
      <main className="db-main">{children}</main>
    </div>
  );
}
