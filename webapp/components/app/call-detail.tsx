import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DemoCall } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

const outcomeTone: Record<string, string> = {
  answered: "bg-status-success/15 text-status-success",
  missed: "bg-status-danger/15 text-status-danger",
  voicemail: "bg-status-warning/15 text-status-warning",
  callback: "bg-status-info/15 text-status-info",
};

export function CallDetail({ call }: { call: DemoCall | null }) {
  if (!call) {
    return (
      <Card>
        <CardContent className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
          Select a call on the left to inspect transcript, summary, and actions.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-lg">Conversation detail</CardTitle>
          <CardDescription>Transcripts, summaries, and follow-up actions.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge className={outcomeTone[call.outcome]}>{call.outcome}</Badge>
          <span>{call.contact}</span>
          <span className="text-muted-foreground">{call.direction} · {call.duration}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(call.timestamp, "en", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">Summary</h3>
          <p className="text-muted-foreground">{call.summary}</p>
        </div>
        <ScrollArea className="h-48 rounded-2xl border border-border/60">
          <div className="space-y-3 p-4 text-xs text-muted-foreground">
            <p>
              <strong>Caller:</strong> Hi Ava, I'm calling to confirm the dental follow-up. I need something earlier if possible.
            </p>
            <p>
              <strong>Ava:</strong> Absolutely Camila, I can offer Tuesday 10:45 or Wednesday 14:15. Which one fits best?
            </p>
            <p>
              <strong>Caller:</strong> Wednesday 14:15 works great.
            </p>
            <p>
              <strong>Ava:</strong> Perfect. I've booked it and sent a summary email. Anything else I can help with?
            </p>
          </div>
        </ScrollArea>
        <div className="flex flex-wrap gap-2 text-xs">
          {call.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
