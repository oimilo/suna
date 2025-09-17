import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from '@/lib/supabase/server';
import ProfileSettings from '@/components/settings/profile-settings';
import NotificationSettings from '@/components/settings/notification-settings';
import SecuritySettings from '@/components/settings/security-settings';
import { User2, Bell, Shield } from 'lucide-react';

export default async function PersonalAccountSettingsPage() {
  const supabaseClient = await createClient();
  const { data: personalAccount } = await supabaseClient.rpc(
    'get_personal_account',
  );
  
  const { data: user } = await supabaseClient.auth.getUser();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-6">
      {/* Tabs com design Suna */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 p-1">
          <TabsTrigger 
            value="profile"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm transition-all"
          >
            <User2 className="h-3.5 w-3.5 mr-2 opacity-60" />
            <span className="text-xs font-medium">Perfil</span>
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm transition-all"
          >
            <Bell className="h-3.5 w-3.5 mr-2 opacity-60" />
            <span className="text-xs font-medium">Notificações</span>
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm transition-all"
          >
            <Shield className="h-3.5 w-3.5 mr-2 opacity-60" />
            <span className="text-xs font-medium">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings account={personalAccount} user={user?.user} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}