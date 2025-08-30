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
import { UserCheck } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
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
            <Badge variant="secondary">
              {attendees.length} students checked in
            </Badge>
          </div>

          {attendees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No check-ins yet</p>
              <p className="text-sm">Students who check in will appear here</p>
            </div>
          ) : (
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
                    <TableCell className="font-mono text-xs">
                      {student.blockchainTxHash}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
