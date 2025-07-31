import { maintenanceNoticeFlag } from '@/lib/edge-flags';
import DashboardLayoutContent from '@/components/dashboard/layout-content';
import { cookies } from 'next/headers';
import { SidebarProvider } from '@/contexts/sidebar-context';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const getMaintenanceNotice = async () => {
  const maintenanceNotice = await maintenanceNoticeFlag();
  return maintenanceNotice;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  await cookies();
  const maintenanceNotice = await getMaintenanceNotice();
  return (
    <SidebarProvider>
      <DashboardLayoutContent maintenanceNotice={maintenanceNotice}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}
