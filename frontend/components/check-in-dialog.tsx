"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, UserCheck } from "lucide-react";
import type { Session } from "@/lib/session-manager";

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onCheckIn: (sessionId: string) => void;
}

export function CheckInDialog({
  open,
  onOpenChange,
  session,
  onCheckIn,
}: CheckInDialogProps) {
  if (!session) return null;

  const handleCheckIn = () => {
    onCheckIn(session.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] px-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Check In to Session</DialogTitle>
          <DialogDescription>
            Confirm your attendance for this session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">{session.title}</h3>
            <p className="text-sm text-muted-foreground">
              {session.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{session.startDate}</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{session.startTime}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{session.location}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="default">Active Session</Badge>
            <span className="text-sm text-muted-foreground">
              {session.attendanceCount} students checked in
            </span>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              className="bg-primary hover:bg-primary/90"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Check In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
