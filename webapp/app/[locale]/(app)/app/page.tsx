import { redirect } from "next/navigation";

interface AppIndexPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AppIndexPage({ params }: AppIndexPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}
