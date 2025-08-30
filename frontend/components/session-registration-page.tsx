/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { SessionManager, type Session } from "@/lib/session-manager";

interface SessionRegistrationPageProps {
  sessionId: string;
}

export function SessionRegistrationPage({
  sessionId,
}: SessionRegistrationPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await SessionManager.getSessionById(sessionId);
        if (!sessionData) {
          setError("Session not found");
          return;
        }

        // Check if session has ended
        const now = new Date();
        const sessionStart = new Date(
          `${sessionData.startDate ?? "2025-08-27"}T${
            sessionData.startTime ?? "12:00"
          }`
        );
        const sessionEnd = new Date(
          sessionStart.getTime() + (sessionData.duration ?? 60) * 60000
        );

        setSession(sessionData);

        // Check if user is already registered (in real app, check against user wallet)
        const mockUserId = "user123"; // In real app, get from wallet connection
        setRegistered(
          sessionData.registeredStudents?.some(
            (student) => student.id === mockUserId
          ) || false
        );
      } catch (err) {
        setError("Failed to load session");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const handleRegister = async () => {
    if (!session) return;

    setRegistering(true);
    try {
      await SessionManager.registerForSession(
        session.id,
      );
      setRegistered(true);
    } catch (err) {
      setError("Failed to register for session");
    } finally {
      setRegistering(false);
    }
  };

  const getStatusBadge = (status: Session["status"]) => {
    const variants = {
      upcoming: "secondary",
      active: "default",
      completed: "outline",
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading session...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">{error}</h2>
              <p className="text-gray-600">
                {error === "Session not found"
                  ? "The session you're looking for doesn't exist or may have been removed."
                  : "This session has ended and is no longer accepting registrations."}
              </p>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Session Registration
          </CardTitle>
          <CardDescription>
            Register for this session to be able to check in when it starts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-gray-900">
                {session.title}
              </h3>
              {getStatusBadge(session.status)}
            </div>

            {session.description && (
              <p className="text-gray-600">{session.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Date:</span>
                <span>{session.startDate}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Time:</span>
                <span>{session.startTime}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Duration:</span>
                <span>{session.duration} minutes</span>
              </div>

              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Location:</span>
                <span>{session.location}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Registered Students:</span>
              <span>{session.registeredStudents?.length || 0}</span>
            </div>
          </div>

          <div className="border-t pt-6">
            {registered ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold text-green-700">
                  Successfully Registered!
                </h3>
                <p className="text-gray-600">
                  You&apos;re registered for this session. You&apos;ll be able
                  to check in when the session becomes active.
                </p>
                <Button
                  onClick={() => (window.location.href = "/")}
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Register for this Session
                </h3>
                <p className="text-gray-600">
                  Click the button below to register for this session.
                  You&apos;ll need to be registered before you can check in.
                </p>
                <Button
                  onClick={handleRegister}
                  disabled={registering}
                  className="bg-primary hover:bg-primary/90"
                >
                  {registering ? "Registering..." : "Register for Session"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
