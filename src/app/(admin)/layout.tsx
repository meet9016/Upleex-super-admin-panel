import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionProvider } from "@/contexts/PermissionContext";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionProvider>
      <AdminLayout>{children}</AdminLayout>
    </PermissionProvider>
  );
}
