import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoLogs } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

const levelTone: Record<string, string> = {
  info: "bg-status-info/15 text-status-info",
  warning: "bg-status-warning/15 text-status-warning",
  error: "bg-status-danger/15 text-status-danger",
};

export function LogsTable() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <CardTitle className="text-lg">Event log</CardTitle>
          <CardDescription>Realtime webhooks, guardrails, and email notifications.</CardDescription>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoLogs.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <Badge className={levelTone[event.level]}>{event.level}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{event.source}</TableCell>
                <TableCell className="text-sm">{event.message}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(event.timestamp, "en", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    month: "short",
                    day: "numeric",
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
