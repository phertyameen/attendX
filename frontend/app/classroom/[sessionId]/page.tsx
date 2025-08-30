import { ClassroomPage } from "@/components/classroom-page";

interface PageProps {
  params: {
    sessionId: string;
  };
}

export default function Classroom({ params }: PageProps) {
  return <ClassroomPage sessionId={params.sessionId} />;
}
