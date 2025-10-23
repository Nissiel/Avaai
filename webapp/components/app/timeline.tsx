import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { demoTimeline } from "@/lib/mock-data";

export function ActivityTimeline() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <CardTitle className="text-lg">Recent activity</CardTitle>
        <ul className="space-y-4">
          {demoTimeline.map((event) => (
            <li key={event.id} className="relative pl-6">
              <span className="absolute left-0 top-1 h-2 w-2 rounded-full bg-brand-500" aria-hidden />
              <p className="text-sm font-semibold">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.description}</p>
              <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
