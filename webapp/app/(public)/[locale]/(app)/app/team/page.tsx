import { TeamTable } from "@/components/app/team-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Team & roles</h1>
          <p className="text-sm text-muted-foreground">Manage invitations, permissions, and audit activity.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost">Copy invite link</Button>
          <Button>Invite member</Button>
        </div>
      </header>
      <TeamTable />
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Roles: Owners manage billing & security, Admins manage routing & playbooks, Members review inbox tasks.
        </CardContent>
      </Card>
    </div>
  );
}
