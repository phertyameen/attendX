"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, Users } from "lucide-react";
import type { Session } from "@/lib/session-manager";

interface ViewAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
}

export function ViewAttendanceDialog({
  open,
  onOpenChange,
  session,
}: ViewAttendanceDialogProps) {
  if (!session) return null;

  const attendees =
    session.registeredStudents?.filter((student) => student.checkedInAt) || [];
  const registeredStudents = session.registeredStudents || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] px-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{session.title} - Attendance</DialogTitle>
          <DialogDescription>
            Students who have checked in to this session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {session.startDate} at {session.startTime} • {session.location}
              </p>
            </div>
            <div className="flex space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{registeredStudents.length} registered</span>
              </Badge>
              <Badge
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <UserCheck className="w-3 h-3" />
                <span>{attendees.length} checked in</span>
              </Badge>
            </div>
          </div>

          {attendees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                No students have checked in yet
              </p>
              <p className="text-sm">
                {registeredStudents.length > 0
                  ? `${registeredStudents.length} students are registered but haven't checked in`
                  : "No students have registered for this session"}
              </p>
            </div>
          ) : (
            <>
              <div className="mobile-card space-y-4 md:hidden">
                {attendees.map((student) => (
                  <Card
                    key={student.id}
                    className="border-l-4 border-l-primary"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{student.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              {student.walletAddress}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Attended
                          </Badge>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Check-in time:
                            </span>
                            <span className="font-medium">
                              {student.checkedInAt}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-muted-foreground">
                              Blockchain Tx:
                            </span>
                            <span
                              className="font-mono text-xs truncate max-w-32"
                              title={student.blockchainTxHash}
                            >
                              {student.blockchainTxHash}
                            </span>
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
                      <TableHead>Student</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead>Blockchain Tx</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendees.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {student.walletAddress}
                        </TableCell>
                        <TableCell>{student.checkedInAt}</TableCell>
                        <TableCell
                          className="font-mono text-xs"
                          title={student.blockchainTxHash}
                        >
                          {student.blockchainTxHash}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
