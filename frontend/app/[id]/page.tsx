import { SessionRegistrationPage } from "@/components/session-registration-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;
  return <SessionRegistrationPage sessionId={id} />;
}
