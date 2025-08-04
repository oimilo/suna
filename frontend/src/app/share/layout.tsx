import { SidebarProvider } from '@/contexts/sidebar-context';

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  );
}