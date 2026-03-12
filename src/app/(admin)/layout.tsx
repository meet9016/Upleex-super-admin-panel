import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionProvider } from "@/contexts/PermissionContext";

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic';

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
