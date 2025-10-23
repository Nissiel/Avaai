import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoTeam } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export function TeamTable() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Team members</CardTitle>
            <CardDescription>Manage access, roles, and invitations.</CardDescription>
          </div>
          <Button size="sm">Invite member</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoTeam.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-semibold">{member.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>{member.status}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(member.lastActive, "en", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
