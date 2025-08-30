/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserCheck,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  MapPin,
  UserPlus,
  ExternalLink,
  Video,
} from "lucide-react";
import { CheckInDialog } from "./check-in-dialog";
import { SessionManager, type Session } from "@/lib/session-manager";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type StudentAttendance = {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  location: string;
  status: "attended" | "missed" | "available" | "registered";
  checkedInAt?: string;
  registeredAt?: string;
  blockchainTxHash?: string;
};

export function StudentDashboard() {
  const { address } = useAccount();
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<
    StudentAttendance[]
  >([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  const refreshSessionData = async () => {
    if (!address) return;

    try {
      const allSessions = await SessionManager.getAllSessions(address);

      const studentSessions = allSessions.filter(
        (session) => session.studentStatus !== "none"
      );
      setAvailableSessions(studentSessions);

      const attendance: StudentAttendance[] = studentSessions.map((session) => {
        let status: StudentAttendance["status"];

        if (session.studentStatus === "checked-in") {
          status = "attended";
        } else if (session.studentStatus === "registered") {
          if (session.status === "completed") {
            status = "missed";
          } else {
            status = "registered";
          }
        } else {
          status = "missed";
        }

        return {
          sessionId: session.id,
          sessionTitle: session.title,
          sessionDate: session.startDate || "-",
          sessionTime: session.startTime || "-",
          location: session.location || "-",
          status,
          checkedInAt: session.registeredStudents.find(
            (s) => s.walletAddress === address
          )?.checkedInAt,
          registeredAt:
            session.studentStatus !== "none"
              ? new Date().toLocaleTimeString()
              : undefined,
          blockchainTxHash: session.blockchainTxHash,
        };
      });

      setStudentAttendance(attendance);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load sessions. Please try again.");
    }
  };

  useEffect(() => {
    refreshSessionData();
  }, [address]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async (sessionId: string) => {
    if (!address) return;

    try {
      const session = availableSessions.find((s) => s.id === sessionId);
      if (!session || session.studentStatus === "none") {
        alert("You must register for this session before checking in!");
        return;
      }

      await SessionManager.checkInToSession(sessionId);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await refreshSessionData();

      setShowCheckInDialog(false);
      setSelectedSession(null);
    } catch (error) {
      console.error("Failed to check in:", error);
      toast.error("Failed to check in. Please try again.");
    }
  };

  const attendedCount = studentAttendance.filter(
    (a) => a.status === "attended"
  ).length;
  const registeredCount = studentAttendance.filter(
    (a) => a.status === "registered"
  ).length;
  const totalSessions = studentAttendance.length;
  const attendanceRate =
    totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

  const getStatusBadge = (status: StudentAttendance["status"]) => {
    const variants = {
      attended: "default",
      missed: "destructive",
      available: "secondary",
      registered: "outline",
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // --- MODIFICATION START ---
  // 1. This list now includes ALL active sessions you are part of,
  //    whether you have checked-in ('attended') or not ('registered').
  const activeSessions = studentAttendance.filter((attendance) => {
    const session = availableSessions.find(
      (s) => s.id === attendance.sessionId
    );
    // The key change is here: we no longer check if status is 'registered'.
    // We only care if the session itself is 'active'.
    return session?.status === "active";
  });
  // --- MODIFICATION END ---

  const canCheckInToSession = (session: Session) => {
    if (session.status !== "active") return false;
    const sessionStart = new Date(`${session.startDate}T${session.startTime}`);
    const fourMinutesAfterStart = new Date(
      sessionStart.getTime() + 4 * 60 * 1000
    );
    return currentTime >= fourMinutesAfterStart;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Student Dashboard
        </h1>
        <p className="text-muted-foreground">
          Register for sessions and check in when they become active
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-2xl p-[2px] bg-gradient-to-r from-[rgb(28,60,138)] via-cyan-200 to-[#02B7D5] animate-gradient">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sessions Attended
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendedCount}</div>
              <p className="text-xs text-muted-foreground">
                out of {totalSessions} total sessions
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl p-[2px] bg-gradient-to-r from-[rgb(28,60,138)] via-cyan-200 to-[#02B7D5] animate-gradient">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Registered Sessions
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{registeredCount}</div>
              <p className="text-xs text-muted-foreground">
                waiting to check in
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl p-[2px] bg-gradient-to-r from-[rgb(28,60,138)] via-cyan-200 to-[#02B7D5] animate-gradient">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {attendanceRate >= 80 ? "Excellent attendance!" : "Keep it up!"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl p-[2px] bg-gradient-to-r from-[rgb(28,60,138)] via-cyan-200 to-[#02B7D5] animate-gradient">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions.length}</div>
              <p className="text-xs text-muted-foreground">ready to join</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* active sessions  */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Join the classroom for your active sessions and check in when
            available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 2. Check the length of the new `activeSessions` list. */}
            {activeSessions.length > 0 ? (
              activeSessions.map((attendance) => {
                const session = availableSessions.find(
                  (s) => s.id === attendance.sessionId
                );
                if (!session) return null;

                return (
                  <div
                    key={attendance.sessionId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {attendance.sessionTitle}
                        </h3>
                        {/* 3. Show a badge based on check-in status. */}
                        <Badge
                          variant={
                            attendance.status === "attended"
                              ? "default"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {attendance.status === "attended"
                            ? "Checked-In"
                            : "Registered"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{attendance.sessionDate}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{attendance.sessionTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{attendance.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => router.push(`/classroom/${session.id}`)}
                        variant="outline"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Join Classroom
                      </Button>

                      {/* 4. The "Check In" button now only shows if you haven't checked in yet. */}
                      {attendance.status === "registered" &&
                        canCheckInToSession(session) && (
                          <Button
                            onClick={() => {
                              setSelectedSession(session);
                              setShowCheckInDialog(true);
                            }}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Check In
                          </Button>
                        )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active sessions available for check-in.</p>
                <p className="text-sm">
                  When a session you&apos;re registered for becomes active, it
                  will appear here.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Your complete attendance record for all your sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentAttendance.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No attendance records yet</p>
              <p className="text-sm">
                Your attendance history will appear here once you join sessions
              </p>
            </div>
          ) : (
            <>
              <div className="mobile-card space-y-4 md:hidden">
                {studentAttendance.map((attendance) => (
                  <Card
                    key={attendance.sessionId}
                    className="border-l-4 border-l-primary"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {attendance.sessionTitle}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="w-4 h-4" />
                              <span>{attendance.sessionDate}</span>
                              <Clock className="w-4 h-4" />
                              <span>{attendance.sessionTime}</span>
                            </div>
                          </div>
                          {getStatusBadge(attendance.status)}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{attendance.location}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {attendance.checkedInAt &&
                              `Checked in: ${attendance.checkedInAt}`}
                            {attendance.registeredAt &&
                              !attendance.checkedInAt &&
                              `Registered`}
                            {!attendance.checkedInAt &&
                              !attendance.registeredAt &&
                              "-"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="desktop-table hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentAttendance.map((attendance) => (
                      <TableRow key={attendance.sessionId}>
                        <TableCell className="font-medium">
                          {attendance.sessionTitle}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{attendance.sessionDate}</span>
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{attendance.sessionTime}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{attendance.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(attendance.status)}
                        </TableCell>
                        <TableCell>
                          {attendance.checkedInAt &&
                            `Checked in: ${attendance.checkedInAt}`}
                          {attendance.registeredAt &&
                            !attendance.checkedInAt &&
                            `Registered`}
                          {!attendance.checkedInAt &&
                            !attendance.registeredAt &&
                            "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardContent className="">
          <div className="flex md:items-center gap-3">
            <ExternalLink className="w-20 md:w-5 md:h-5 text-primary" />
            <div>
              <h3 className="font-medium text-primary">How to Join Sessions</h3>
              <p className="text-sm mt-1">
                Get a registration link from your instructor to register for
                sessions. Once registered, you can check in when the session
                becomes active. Sessions automatically close at their scheduled
                end time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CheckInDialog
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        session={selectedSession}
        onCheckIn={handleCheckIn}
      />
    </div>
  );
}
