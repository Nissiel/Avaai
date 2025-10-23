import { AppShell } from "@/components/layouts/app-shell";
import { demoOrganizations } from "@/lib/mock-data";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell organizations={demoOrganizations}>{children}</AppShell>;
}
