'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TasksPage } from '@/components/tasks/tasks-page';
import { TriggersPage } from '@/components/triggers/triggers-page';

export default function AutomationsPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="advanced">Automations avançadas</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <TasksPage />
        </TabsContent>

        <TabsContent value="advanced">
          <TriggersPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
