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

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await SessionManager.getAllSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
        toast.error("Failed to load sessions");
      }
    };

    loadSessions();
  }, []);

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
      // Fallback for browsers that don't support clipboard API
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

  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();

  const handleCreateSession = async (sessionData: any) => {
    try {
      if (!walletClient || !address) {
        // alert("Please connect your wallet first.");
        toast.error("Please connect your wallet first");
        return;
      }

      setIsCreating(true);

      try {
        const provider = new ethers.BrowserProvider(walletClient.transport);
        const signer = await provider.getSigner();
        const attendanceContract = getAttendanceContract(signer);

        console.log("Creating session with data:", sessionData);
        console.log("Contract address:", attendanceContract.target);
        console.log("User address:", address);

        // Estimate gas first
        const gasEstimate = await attendanceContract.createSession.estimateGas(
          sessionData.title
        );
        console.log("Gas estimate:", gasEstimate.toString());

        // Send transaction
        const tx = await attendanceContract.createSession(sessionData.title, {
          gasLimit: (gasEstimate * BigInt(120)) / BigInt(100), // 20% buffer
        });

        console.log("Transaction sent:", tx.hash);
        toast.info("Transaction sent. Waiting for confirmation...");

        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);

        // Parse the SessionCreated event from the logs
        let sessionId: string | null = null;

        for (const log of receipt.logs) {
          try {
            const parsedLog = attendanceContract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === "SessionCreated") {
              sessionId = parsedLog.args[0].toString();
              console.log("Found SessionCreated event, sessionId:", sessionId);
              break;
            }
          } catch (error) {
            // Skip logs that can't be parsed by our contract
            continue;
          }
        }

        if (!sessionId) {
          throw new Error("SessionCreated event not found in transaction logs");
        }

        // Save to local session manager
       await SessionManager.createSession({
          sessionId,
          txHash: receipt.hash,
          title: sessionData.title,
          startDate: sessionData.startDate,
          startTime: sessionData.startTime,
          duration: sessionData.duration,
          location: sessionData.location,
          description: sessionData.description,
          createdBy: address,
        });

        const allSessions = await SessionManager.getAllSessions();
        setSessions(allSessions);
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
        } else if (error.code === "INSUFFICIENT_FUNDS") {
          toast.error("Insufficient funds for transaction");
        } else if (error.reason) {
          toast.error(`Contract error: ${error.reason}`);
        } else {
          toast.error(`Failed to create session: ${error.message}`);
        }
      } finally {
        setIsCreating(false);
      }
    } catch {
      console.log("first");
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Create sessions and share registration links with students
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={!isConnected || !walletClient || isCreating}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50"
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

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Manage your attendance sessions. Share registration links with
            students so they can register before the session starts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No sessions created yet. Create your first session to get
                started.
              </p>
            </div>
          ) : (
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
                        <span>{session.location || "not set"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{session.registeredStudents?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{session.attendanceCount} students</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copySessionLink(session.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {copiedSessionId === session.id ? (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Share2 className="w-4 h-4 mr-1" />
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSession(session);
                            setShowAttendanceDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                        </Button>
                        {session.status === "upcoming" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditForm(session)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Share2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">
                How Session Registration Works
              </h3>
              <p className="text-sm text-blue-700 mt-1">
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
