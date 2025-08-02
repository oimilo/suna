import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from '@/lib/supabase/server';
import ProfileSettings from '@/components/settings/profile-settings';
import PlanSettings from '@/components/settings/plan-settings';
import NotificationSettings from '@/components/settings/notification-settings';
import SecuritySettings from '@/components/settings/security-settings';

export default async function PersonalAccountSettingsPage() {
  const supabaseClient = await createClient();
  const { data: personalAccount } = await supabaseClient.rpc(
    'get_personal_account',
  );
  
  const { data: user } = await supabaseClient.auth.getUser();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Conta</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings account={personalAccount} user={user?.user} />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <PlanSettings account={personalAccount} />
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