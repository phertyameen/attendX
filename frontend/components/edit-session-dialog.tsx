"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Session } from "@/lib/session-manager";

interface EditSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onEditSession: (sessionData: unknown) => void;
}

export function EditSessionDialog({
  open,
  onOpenChange,
  session,
  onEditSession,
}: EditSessionDialogProps) {
  const [sessionData, setSessionData] = useState({
    title: "",
    startDate: "",
    startTime: "",
    duration: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    if (session) {
      setSessionData({
        title: session.title,
        startDate: session.startDate,
        startTime: session.startTime,
        duration: session.duration.toString(),
        location: session.location,
        description: session.description,
      });
    }
  }, [session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEditSession({
      ...sessionData,
      duration: Number.parseInt(sessionData.duration),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>
            Edit session details. Only upcoming sessions can be modified.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={sessionData.title}
              onChange={(e) =>
                setSessionData({ ...sessionData, title: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={sessionData.startDate}
                onChange={(e) =>
                  setSessionData({ ...sessionData, startDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={sessionData.startTime}
                onChange={(e) =>
                  setSessionData({ ...sessionData, startTime: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={sessionData.duration}
                onChange={(e) =>
                  setSessionData({ ...sessionData, duration: e.target.value })
                }
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={sessionData.location}
                onChange={(e) =>
                  setSessionData({ ...sessionData, location: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={sessionData.description}
              onChange={(e) =>
                setSessionData({ ...sessionData, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update Session</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
