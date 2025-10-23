import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoSchedule } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

const channelLabel: Record<string, string> = {
  voice: "Voice",
  video: "Video",
  "in-person": "In person",
};

export function ScheduleBoard() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-lg">Upcoming meetings</CardTitle>
          <CardDescription>Synced automatically from Google and Outlook calendars.</CardDescription>
        </div>
        <ul className="space-y-3">
          {demoSchedule.map((slot) => (
            <li key={slot.id} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{slot.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(slot.start, "en", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" – "}
                    {formatDate(slot.end, "en", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Badge variant="accent" className="bg-accent/60">
                  {channelLabel[slot.channel]}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Organiser: {slot.organizer} · Attendees: {slot.attendees.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
