import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoCalls } from "@/lib/mock-data";

const outcomeBadge: Record<string, string> = {
  answered: "bg-status-success/15 text-status-success",
  missed: "bg-status-danger/15 text-status-danger",
  voicemail: "bg-status-warning/15 text-status-warning",
  callback: "bg-status-info/15 text-status-info",
};

export function CallsTable() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Recent calls</h2>
            <p className="text-sm text-muted-foreground">Monitor conversations and outcomes from the last 48 hours.</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoCalls.map((call) => (
              <TableRow key={call.id}>
                <TableCell className="font-medium">{call.contact}</TableCell>
                <TableCell className="capitalize">{call.direction}</TableCell>
                <TableCell>
                  <Badge className={outcomeBadge[call.outcome] ?? ""}>{call.outcome}</Badge>
                </TableCell>
                <TableCell className="max-w-[320px] text-sm text-muted-foreground">{call.summary}</TableCell>
                <TableCell>{call.duration}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {call.tags.map((tag) => (
                      <Badge key={tag} variant="accent" className="bg-accent/60">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
