import { ClassroomPage } from "@/components/classroom-page";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function Classroom({ params }: PageProps) {
  const { sessionId } = await params;

  return <ClassroomPage sessionId={sessionId} />;
}
