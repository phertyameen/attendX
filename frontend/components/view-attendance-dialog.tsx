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
import type { Session, Student } from "@/lib/session-manager";

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
  // Mock student data - in real app this would come from blockchain
  const mockStudents: Student[] = [
    {
      id: "1",
      name: "Alice Johnson",
      walletAddress: "0x1234...5678",
      checkedInAt: "10:05 AM",
      blockchainTxHash: "0xabc123...",
    },
    {
      id: "2",
      name: "Bob Smith",
      walletAddress: "0x2345...6789",
      checkedInAt: "10:03 AM",
      blockchainTxHash: "0xdef456...",
    },
  ];

  if (!session) return null;

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
              {mockStudents.length} students checked in
            </Badge>
          </div>

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
              {mockStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
