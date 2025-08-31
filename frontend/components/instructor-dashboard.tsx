/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Plus,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Edit,
  Share2,
  Copy,
  Users,
  Award,
  TrendingUp,
  Timer,
  Video,
} from "lucide-react";
import { CreateSessionDialog } from "./create-session-dialog";
import { ViewAttendanceDialog } from "./view-attendance-dialog";
import { EditSessionDialog } from "./edit-session-dialog";
import { SessionManager, type Session } from "@/lib/session-manager";
import { getAttendanceContract } from "@/lib/contract";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// import AttendanceABI from "@/lib/abis/AttendanceABI.json";

export function InstructorDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  useEffect(() => {
    const loadSessions = async () => {
      // If no wallet is connected, clear the sessions and do nothing.
      if (!address) {
        setSessions([]);
        return;
      }
      try {
        const allSessions = await SessionManager.getAllSessions();
        // Filter sessions to only show those created by the current instructor.
        const instructorSessions = allSessions.filter(
          (session) => session.createdBy === address
        );
        setSessions(instructorSessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
        toast.error("Failed to load sessions");
      }
    };

    loadSessions();
  }, [address]);

  useEffect(() => {
    const updateSessionStatus = () => {
      const now = new Date();
      setSessions((prevSessions) =>
        prevSessions.map((session) => {
          const sessionStart = new Date(
            `${session.startDate}T${session.startTime}`
          );
          const sessionEnd = new Date(
            sessionStart.getTime() + session.duration * 60000
          );

          let newStatus = session.status;
          if (
            now >= sessionStart &&
            now < sessionEnd &&
            session.status === "upcoming"
          ) {
            newStatus = "active";
          } else if (now >= sessionEnd && session.status === "active") {
            newStatus = "completed";
          }

          return newStatus !== session.status
            ? { ...session, status: newStatus }
            : session;
        })
      );
    };

    const interval = setInterval(updateSessionStatus, 60000); // Check every minute
    updateSessionStatus(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const copySessionLink = async (sessionId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const sessionLink = `${baseUrl}/${sessionId}`;

    try {
      await navigator.clipboard.writeText(sessionLink);
      setCopiedSessionId(sessionId);
      setTimeout(() => setCopiedSessionId(null), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
      const textArea = document.createElement("textarea");
      textArea.value = sessionLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedSessionId(sessionId);
      setTimeout(() => setCopiedSessionId(null), 2000);
    }
  };

  const handleCreateSession = async (sessionData: any) => {
    try {
      if (!walletClient || !address) {
        toast.error("Please connect your wallet first");
        return;
      }

      setIsCreating(true);

      try {
        const provider = new ethers.BrowserProvider(walletClient.transport);
        const signer = await provider.getSigner();
        const attendanceContract = getAttendanceContract(signer);

        const gasEstimate = await attendanceContract.createSession.estimateGas(
          sessionData.title
        );
        const tx = await attendanceContract.createSession(sessionData.title, {
          gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
        });

        toast.info("Transaction sent. Waiting for confirmation...");
        const receipt = await tx.wait();
        let sessionId: string | null = null;

        for (const log of receipt.logs) {
          try {
            const parsedLog = attendanceContract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === "SessionCreated") {
              sessionId = parsedLog.args[0].toString();
              break;
            }
          } catch (error) {
            continue;
          }
        }

        if (!sessionId) {
          throw new Error("SessionCreated event not found in transaction logs");
        }

        await SessionManager.createSession({
          sessionId,
          txHash: receipt.hash,
          title: sessionData.title,
          startDate: sessionData.startDate,
          startTime: sessionData.startTime,
          duration: sessionData.duration,
          location: sessionData.location,
          description: sessionData.description,
          createdBy: address, // Ensure the creator's address is saved
        });

        const allSessions = await SessionManager.getAllSessions();
        const instructorSessions = allSessions.filter(
          (session) => session.createdBy === address
        );
        setSessions(instructorSessions);

        setShowCreateForm(false);
        toast.success(
          `Session ${sessionId} created successfully! Transaction: ${receipt.hash.substring(
            0,
            10
          )}...`
        );
      } catch (error: any) {
        console.error("Failed to create session:", error);
        if (error.code === "ACTION_REJECTED") {
          toast.error("Transaction was rejected by user");
        } else if (error.reason) {
          toast.error(`Contract error: ${error.reason}`);
        } else {
          toast.error(`Failed to create session: ${error.message}`);
        }
      } finally {
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error in handleCreateSession:", error);
    }
  };

  const handleEditSession = async (sessionData: any) => {
    if (!editingSession) return;

    try {
      const updatedSession = await SessionManager.updateSession(
        editingSession.id,
        sessionData
      );
      setSessions(
        sessions.map((s) =>
          s.id === editingSession.id ? { ...s, ...updatedSession } : s
        )
      );
      setShowEditForm(false);
      setEditingSession(null);
    } catch (error) {
      console.error("Failed to update session:", error);
      toast.error("Failed to update session");
    }
  };

  const openEditForm = (session: Session) => {
    if (session.status !== "upcoming") {
      toast.error("Cannot edit active or completed sessions");
      return;
    }
    setEditingSession(session);
    setShowEditForm(true);
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

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const completedSessions = sessions.filter(
    (s) => s.status === "completed"
  ).length;
  const totalAttendance = sessions.reduce(
    (sum, session) => sum + (session.attendanceCount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 md:gap-0 md:justify-between items-end md:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Create sessions and share registration links with students
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={!isConnected || !walletClient || isCreating}
          className="disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? "Creating..." : "Create Session"}
        </Button>
      </div>

      {!isConnected && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-yellow-500" />
              <div>
                <h3 className="font-medium text-yellow-900">
                  Wallet Not Connected
                </h3>
                <p className="text-sm text-yellow-700">
                  Please connect your wallet to create and manage sessions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* analysis */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-2xl p-[2px] bg-gradient-to-r from-[rgb(28,60,138)] via-cyan-200 to-[#02B7D5] animate-gradient">
          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sessions
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {activeSessions} active, {completedSessions} completed
              </p>
            </CardContent>
          </Card>
        </div>

        <div className=" rounded-2xl p-[2px] bg-gradient-to-r from-[rgb(28,60,138)] via-cyan-200 to-[#02B7D5] animate-gradient">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Attendance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAttendance}</div>
              <p className="text-xs text-muted-foreground">
                Total students checked-in
              </p>
            </CardContent>
          </Card>
        </div>

        <div className=" rounded-2xl p-[2px] bg-gradient-to-r from-[rgb(28,60,138)] via-cyan-200 to-[#02B7D5] animate-gradient">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions}</div>
              <p className="text-xs text-muted-foreground">currently running</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* tables */}
      <Card>
        <CardHeader className="px-3 md:px-6">
          <CardTitle>Your Sessions</CardTitle>
          <CardDescription>
            Manage your attendance sessions. Share registration links with
            students so they can register before the session starts.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No sessions created yet</p>
              <p className="text-sm">
                Click &quot;Create Session&quot; to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="mobile-card space-y-4 md:hidden">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="border-l-4 border-l-primary py-4 sm:py-6"
                  >
                    <CardContent className="px-2 sm:px-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">
                              {session.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {session.description}
                            </p>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{session.startDate}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{session.startTime}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{session.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {session.registeredStudents?.length || 0}{" "}
                              registered
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Timer className="w-4 h-4 text-muted-foreground" />
                            <span>{session.duration || 0} min</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            {session.attendanceCount || 0} attended
                          </div>
                          <div className="flex space-x-2">
                            {session.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/classroom/${session.id}`)
                                }
                                className="h-8 w-8 p-0 bg-primary"
                                title="Join Classroom"
                              >
                                <Video className="w-4 h-4 text-white" />
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => copySessionLink(session.id)}
                              className="h-8 w-8 p-0"
                              title="Share registration link"
                            >
                              {copiedSessionId === session.id ? (
                                <Copy className="w-4 h-4 text-white" />
                              ) : (
                                <Share2 className="w-4 h-4 text-white" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              onClick={() => {
                                setSelectedSession(session);
                                setShowAttendanceDialog(true);
                              }}
                              className="h-8 w-8 p-0"
                              title="View attendance"
                            >
                              <Eye className="w-4 h-4 text-white" />
                            </Button>
                            {session.status === "upcoming" && (
                              <Button
                                size="icon"
                                onClick={() => openEditForm(session)}
                                className="h-8 w-8 p-0 bg-primary"
                                title="Edit session "
                              >
                                <Edit className="w-4 h-4 text-white" />
                              </Button>
                            )}
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
                      <TableHead>Duration</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Attended</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{session.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {session.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{session.startDate}</span>
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{session.startTime}</span>
                          </div>
                        </TableCell>
                        <TableCell>{session.duration} min</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{session.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {session.registeredStudents?.length || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.attendanceCount || 0} students
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {session.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/classroom/${session.id}`)
                                }
                                className="h-8 w-8 p-0 hover:bg-green-500/20"
                                title="Join Classroom"
                              >
                                <Video className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copySessionLink(session.id)}
                              className="h-8 w-8 p-0 hover:bg-secondary/20"
                              title="Share registration link"
                            >
                              {copiedSessionId === session.id ? (
                                <Copy className="w-4 h-4 text-green-600" />
                              ) : (
                                <Share2 className="w-4 h-4 text-secondary" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSession(session);
                                setShowAttendanceDialog(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-accent/20"
                              title="View attendance"
                            >
                              <Eye className="w-4 h-4 text-[#7276c6]" />
                            </Button>
                            {session.status === "upcoming" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditForm(session)}
                                className="h-8 w-8 p-0 hover:bg-primary/20"
                                title="Edit session"
                              >
                                <Edit className="w-4 h-4 text-primary" />
                              </Button>
                            )}
                          </div>
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

      <Card className=" border-primary py-3 md:py-6">
        <CardContent className="px-3 md:px-6">
          <div className="flex md:items-center space-x-3">
            <Share2 className="w-20 md:w-5 md:h-5 text-primary" />
            <div>
              <h3 className="font-medium text-primary">
                How Session Registration Works
              </h3>
              <p className="text-sm mt-1">
                Click the &quot;Share&quot; button to copy a registration link
                for any session. Students must register using this link before
                they can check in when the session becomes active. Sessions
                automatically close at their scheduled end time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateSessionDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onCreateSession={handleCreateSession}
      />

      <ViewAttendanceDialog
        open={showAttendanceDialog}
        onOpenChange={setShowAttendanceDialog}
        session={selectedSession}
      />

      <EditSessionDialog
        open={showEditForm}
        onOpenChange={setShowEditForm}
        session={editingSession}
        onEditSession={handleEditSession}
      />
    </div>
  );
}
