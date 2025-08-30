"use client";

import type React from "react";

import { useState } from "react";
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
import { toast } from "sonner";

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSession: (sessionData: unknown) => void;
}

export function CreateSessionDialog({
  open,
  onOpenChange,
  onCreateSession,
}: CreateSessionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState({
    title: "",
    startDate: "",
    startTime: "",
    duration: "",
    location: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      onCreateSession({
        ...sessionData,
        duration: Number.parseInt(sessionData.duration),
      });
      toast.success("Session created successfully!");
      onOpenChange(false);
      setSessionData({
        title: "",
        startDate: "",
        startTime: "",
        duration: "",
        location: "",
        description: "",
      });
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Create a new attendance session. Once active, the session cannot be
            edited.
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
              placeholder="e.g., Introduction to Blockchain"
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
                placeholder="90"
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
                placeholder="Room 101"
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
              placeholder="Brief description of the session..."
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating" : "Create Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
