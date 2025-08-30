"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, CheckCircle } from "lucide-react";
import type { Session } from "@/lib/session-manager";

interface SessionRegistrationDialogProps {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (sessionId: string) => void;
  isRegistered: boolean;
}

export function SessionRegistrationDialog({
  session,
  open,
  onOpenChange,
  onRegister,
  isRegistered,
}: SessionRegistrationDialogProps) {
  const [isRegistering, setIsRegistering] = useState(false);

  if (!session) return null;

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate blockchain transaction
      onRegister(session.id);
    } finally {
      setIsRegistering(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

//   const getSessionDateTime = () => {
//     return new Date(`${session.startDate}T${session.startTime}`);
//   };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Session Registration</DialogTitle>
          <DialogDescription>
            Register for this session to be able to check in when it becomes
            active
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{session.title}</CardTitle>
            <CardDescription>{session.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(session.startDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {formatTime(session.startTime)} -{" "}
                  {formatTime(session.endTime)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{session.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>
                  {session.registeredStudents?.length || 0} registered
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Badge
                variant={
                  session.status === "upcoming"
                    ? "secondary"
                    : session.status === "active"
                    ? "default"
                    : "outline"
                }
              >
                {session.status.charAt(0).toUpperCase() +
                  session.status.slice(1)}
              </Badge>
            </div>

            {isRegistered ? (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  You are registered for this session
                </span>
              </div>
            ) : (
              <Button
                onClick={handleRegister}
                disabled={isRegistering || session.status === "completed"}
                className="w-full"
              >
                {isRegistering ? "Registering..." : "Register for Session"}
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              You can only check in to this session once it becomes active and
              you are registered.
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
