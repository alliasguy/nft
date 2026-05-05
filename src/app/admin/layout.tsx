import AdminSidebar from "@/components/AdminSidebar";

export const metadata = { title: "Admin Console — NFTX" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-layout">
      <AdminSidebar />
      <main className="adm-main">{children}</main>
    </div>
  );
}
