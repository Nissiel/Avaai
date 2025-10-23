import type { ReactNode } from "react";

import { MarketingShell } from "@/components/layouts/marketing-shell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
