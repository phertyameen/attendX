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
} from "lucide-react";
import { CheckInDialog } from "./check-in-dialog";
import { SessionManager, type Session } from "@/lib/session-manager";
import { useAccount } from "wagmi";
import { toast } from "sonner";

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

 const refreshSessionData = async () => {
    if (!address) return;
    
    try {
      const allSessions = await SessionManager.getAllSessions(address);
      setAvailableSessions(allSessions);

      // Convert sessions to student attendance format
      const attendance: StudentAttendance[] = allSessions.map((session) => {
        let status: StudentAttendance["status"] = "available";
        
        if (session.studentStatus === "checked-in") {
          status = "attended";
        } else if (session.studentStatus === "registered") {
          status = "registered";
        } else if (session.status === "completed") {
          status = "missed";
        }

        return {
          sessionId: session.id,
          sessionTitle: session.title,
          sessionDate: session.startDate || "-",
          sessionTime: session.startTime || "-",
          location: session.location || "-",
          status,
          checkedInAt: session.registeredStudents.find(s => s.walletAddress === address)?.checkedInAt,
          registeredAt: session.studentStatus !== "none" ? new Date().toLocaleTimeString() : undefined,
          blockchainTxHash: session.blockchainTxHash,
        };
      });

      setStudentAttendance(attendance);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load sessions. Please try again.");
    } finally {
    }
  };

  useEffect(() => {
    refreshSessionData();
  }, [address]);


  const handleRegisterForSession = async (sessionId: string) => {
    if (!address) return;
    
    try {
      await SessionManager.registerForSession(sessionId);
      
      // Wait a moment for blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh all session data to get updated status
      await refreshSessionData();
    } catch (error) {
      console.error("Failed to register for session:", error);
      toast.error("Failed to register for session. Please try again.");
    } finally {
    }
  };

  const handleCheckIn = async (sessionId: string) => {
   if (!address) return;
    
    try {   
      // Check if user is actually registered first
      const session = availableSessions.find(s => s.id === sessionId);
      if (!session || session.studentStatus === "none") {
        alert("You must register for this session before checking in!");
        return;
      }

      await SessionManager.checkInToSession(sessionId);
      
      // Wait a moment for blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh all session data
      await refreshSessionData();
      
      setShowCheckInDialog(false);
      setSelectedSession(null);
    } catch (error) {
      console.error("Failed to check in:", error);
      toast.error("Failed to check in. Please try again.");
    } finally {
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registered Sessions
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registeredCount}</div>
            <p className="text-xs text-muted-foreground">waiting to check in</p>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available to Check In
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentAttendance.filter((a) => a.status === "available").length}
            </div>
            <p className="text-xs text-muted-foreground">active sessions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Sessions you&apos;re registered for that are currently active -
            check in now!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentAttendance
              .filter(
                (attendance) => {
                  const session = availableSessions.find((s) => s.id === attendance.sessionId);
                  return attendance.status === "registered" && session?.status === "active"
                }
              )
              .map((attendance) => {
                const session = availableSessions.find(
                  (s) => s.id === attendance.sessionId
                );
                if (!session) return null;

                const isRegistered = session.studentStatus === "registered" || session.studentStatus === "checked-in";
                const canCheckIn = isRegistered && session.status === "active";

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
                        {isRegistered && (
                          <Badge variant="outline" className="text-xs">
                            Registered
                          </Badge>
                        )}
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
                    <Button
                      onClick={() => {
                        if (!isRegistered) {
                          handleRegisterForSession(session.id);
                        } else if (canCheckIn) {
                          setSelectedSession(session);
                          setShowCheckInDialog(true);
                        }
                      }}
                      disabled={!canCheckIn}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      {!isRegistered
                        ? "Register"
                        : canCheckIn
                        ? "Check In"
                        : "Not Active"}
                    </Button>
                  </div>
                );
              })}
            {studentAttendance.filter(
              (a) => a.status === "registered" || a.status === "available"
            ).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active sessions available.</p>
                <p className="text-sm">
                  Ask your instructor for a registration link to join a session.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className=" border-gradient">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">
                How to Join Sessions
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Get a registration link from your instructor to register for
                sessions. Once registered, you can check in when the session
                becomes active. Sessions automatically close at their scheduled
                end time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your complete attendance record</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                  <TableCell>
                    {attendance.checkedInAt &&
                      `Checked in: ${attendance.checkedInAt}`}
                    {attendance.registeredAt &&
                      !attendance.checkedInAt &&
                      `Registered: ${attendance.registeredAt}`}
                    {!attendance.checkedInAt && !attendance.registeredAt && "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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