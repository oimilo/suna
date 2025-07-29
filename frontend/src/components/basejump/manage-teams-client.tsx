'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { CreateTeamDialog } from './create-team-dialog';
import { Badge } from '../ui/badge';
import { Table, TableRow, TableBody, TableCell } from '../ui/table';
import Link from 'next/link';

interface Team {
  account_id: string;
  name: string;
  slug: string;
  is_primary_owner: boolean;
  account_role: string;
}

interface ManageTeamsClientProps {
  teams: Team[];
}

export function ManageTeamsClient({ teams }: ManageTeamsClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Button 
          size="sm" 
          className="gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Criar Equipe
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Você ainda não faz parte de nenhuma equipe.
          </p>
        </div>
      ) : (
        <Table>
          <TableBody>
            {teams.map((team) => (
              <TableRow
                key={team.account_id}
                className="hover:bg-hover-bg border-subtle dark:border-white/10"
              >
                <TableCell>
                  <div className="flex items-center gap-x-2">
                    <span className="font-medium text-card-title">
                      {team.name}
                    </span>
                    <Badge
                      variant={
                        team.account_role === 'owner' ? 'default' : 'outline'
                      }
                      className={
                        team.account_role === 'owner'
                          ? 'bg-primary hover:bg-primary/90'
                          : 'text-foreground/70 border-subtle dark:border-white/10'
                      }
                    >
                      {team.is_primary_owner
                        ? 'Dono Principal'
                        : team.account_role === 'owner' ? 'Dono' : 'Membro'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    asChild
                    className="rounded-lg h-9 border-subtle dark:border-white/10 hover:bg-hover-bg dark:hover:bg-hover-bg-dark"
                  >
                    <Link href={`/${team.slug}`}>Visualizar</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CreateTeamDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  );
}