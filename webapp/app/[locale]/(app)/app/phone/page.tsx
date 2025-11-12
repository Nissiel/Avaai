import { PhoneNumbers } from "@/components/app/phone-numbers";
import { CallsTable } from "@/components/app/calls-table";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function PhonePage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Telephony</h1>
          <p className="text-sm text-muted-foreground">Provision Twilio numbers, configure routing, and test WebRTC.</p>
        </div>
        <Button variant="outline">Run WebRTC test</Button>
      </header>
      <PhoneNumbers />
      <CallsTable />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-lg">Routing rules</CardTitle>
            <CardDescription>Define business hours, fallback voicemail, and escalation emails.</CardDescription>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone-business-hours" className="text-sm font-semibold">Business hours</Label>
              <Input id="phone-business-hours" defaultValue="Mon-Fri · 09:00-18:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone-fallback-email" className="text-sm font-semibold">Fallback email</Label>
              <Input id="phone-fallback-email" defaultValue="ops@lexandco.com" type="email" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone-voicemail" className="text-sm font-semibold">Voicemail prompt</Label>
            <Textarea
              id="phone-voicemail"
              rows={3}
              defaultValue="Thank you for calling Lex & Co. Leave your name and reason and Ava will follow up."
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">SMS fallback</p>
              <p className="text-xs text-muted-foreground">Send an SMS when calls arrive outside hours.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
