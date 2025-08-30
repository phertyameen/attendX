/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Users,
  MessageSquare,
  Monitor,
  Hand,
  Crown,
} from "lucide-react";
import { SessionManager, type Session } from "@/lib/session-manager";
import { useAccount } from "wagmi";

interface ClassroomPageProps {
  sessionId: string;
}

export function ClassroomPage({ sessionId }: ClassroomPageProps) {
  const { address } = useAccount();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isInstructor, setIsInstructor] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string>("");

  useEffect(() => {
    const loadSession = async () => {
      // Guard clause if wallet is not connected
      if (!address) {
        setLoading(false);
        return;
      }
      try {
        const sessionData = await SessionManager.getSessionById(sessionId);
        if (!sessionData) {
          return;
        }
        setSession(sessionData);

        // --- MODIFICATION START ---
        // 1. Determine user role based on real session data.
        const currentUserIsInstructor = address === sessionData.createdBy;
        setIsInstructor(currentUserIsInstructor);

        // 2. Build the participants list dynamically.
        const instructorParticipant = {
          id: sessionData.createdBy,
          name: `Instructor (${
            sessionData.createdBy?.substring(0, 6) ?? "N/A"
          }...)`,
          isInstructor: true,
          video: true,
          audio: true,
          handRaised: false,
        };

        const studentParticipants = sessionData.registeredStudents.map(
          (student) => ({
            id: student.walletAddress,
            name: `Student (${student.walletAddress.substring(0, 6)}...)`,
            isInstructor: false,
            video: Math.random() > 0.5, // Kept for visual variety
            audio: true,
            handRaised: Math.random() > 0.2, // Kept for visual variety
          })
        );

        setParticipants([instructorParticipant, ...studentParticipants]);
        // --- MODIFICATION END ---
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, address]);

  useEffect(() => {
    return () => {
      // Cleanup streams when component unmounts
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream, screenStream]);

  const toggleVideo = async () => {
    try {
      if (!isVideoOn) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: isAudioOn,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
        setMediaError("");
      } else {
        if (localStream) {
          localStream.getVideoTracks().forEach((track) => track.stop());
          if (!isAudioOn) {
            // If audio is also off, kill the stream
            setLocalStream(null);
            if (localVideoRef.current) localVideoRef.current.srcObject = null;
          }
        }
        setIsVideoOn(false);
      }
    } catch (error) {
      console.error("Camera access error:", error);
      setMediaError("Camera access denied or not available.");
      setIsVideoOn(false);
    }
  };

  const toggleAudio = async () => {
    try {
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !isAudioOn;
        });
        setIsAudioOn(!isAudioOn);
      } else if (!isAudioOn) {
        // If no stream, get audio only
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setLocalStream(stream);
        setIsAudioOn(true);
      }
    } catch (error) {
      console.error("Microphone access error:", error);
      setMediaError("Microphone access denied or not available.");
      setIsAudioOn(false);
    }
  };

  const toggleScreenShare = async () => {
    if (!isInstructor) return;

    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreenStream(stream);
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = stream;
        }
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          if (screenShareRef.current) screenShareRef.current.srcObject = null;
        });
        setIsScreenSharing(true);
        setMediaError("");
      } else {
        if (screenStream) {
          screenStream.getTracks().forEach((track) => track.stop());
          setScreenStream(null);
          if (screenShareRef.current) screenShareRef.current.srcObject = null;
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error("Screen sharing error:", error);
      setMediaError("Screen sharing not supported or was denied.");
      setIsScreenSharing(false);
    }
  };

  const toggleHandRaise = () => {
    if (isInstructor) return;
    setIsHandRaised(!isHandRaised);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !address) return;

    // --- MODIFICATION START ---
    // 3. Use dynamic data for sender's name in chat.
    const myName = isInstructor
      ? `Instructor (${address.substring(0, 6)}...)`
      : `Student (${address.substring(0, 6)}...)`;

    const message = {
      id: Date.now().toString(),
      sender: myName,
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isInstructor,
    };
    // --- MODIFICATION END ---

    setChatMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const leaveClassroom = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
   
    window.location.href = isInstructor
      ? "/"
      : "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading classroom...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">
          Session not found or wallet not connected.
        </div>
      </div>
    );
  }

  // Add this helper component inside ClassroomPage
  const VideoTile = ({ stream }: { stream: MediaStream | null }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (videoRef.current && stream) {
        // This assigns the stream to the video element, bypassing the TypeScript error
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full h-full object-cover transform scale-x-[-1] rounded"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">{session?.title}</h1>
            <Badge variant="default" className="bg-green-600">
              Live
            </Badge>
            {isInstructor && (
              <Badge
                variant="outline"
                className="border-yellow-500 text-yellow-500"
              >
                <Crown className="w-3 h-3 mr-1" />
                Instructor
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{participants.length}</span>
          </div>
        </div>
        {mediaError && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
            {mediaError}
          </div>
        )}
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            <div className="md:col-span-2 lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700 h-full">
                <CardContent className="p-0 h-full relative">
                  <div className="bg-gray-700 h-full rounded-lg flex items-center justify-center overflow-hidden">
                    {isScreenSharing && screenStream ? (
                      <video
                        ref={screenShareRef}
                        autoPlay
                        muted
                        className="w-full h-full object-contain"
                      />
                    ) : isVideoOn && localStream ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                    ) : (
                      <div className="text-center">
                        <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p>
                          {isScreenSharing
                            ? "Screen being shared"
                            : "Camera off"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4">
                    {/* --- MODIFICATION START --- */}
                    {/* 5. Display dynamic names in the UI. */}
                    <Badge variant="outline" className="bg-black/50">
                      {participants.find((p) => p.isInstructor)?.name ||
                        "Instructor"}
                      {address === session.createdBy && " (You)"}
                    </Badge>
                    {/* --- MODIFICATION END --- */}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Participants Grid */}
            <div className="space-y-4 overflow-y-auto">
              {participants.map((participant) => (
                <Card
                  key={participant.id}
                  className="bg-gray-800 border-gray-700"
                >
                  <CardContent className="p-2">
                    <div className="bg-gray-700 h-32 rounded flex items-center justify-center relative">
                      {participant.id === address &&
                      localStream &&
                      isVideoOn ? (
                        <VideoTile stream={localStream} />
                      ) : participant.video ? (
                        <Video className="w-8 h-8 text-green-400" />
                      ) : (
                        <VideoOff className="w-8 h-8 text-gray-400" />
                      )}
                      {participant.handRaised && (
                        <Hand className="absolute top-2 right-2 w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm truncate">
                        {participant.name}{" "}
                        {participant.id === address && "(You)"}
                      </span>
                      <div className="flex space-x-1">
                        {participant.audio ? (
                          <Mic className="w-3 h-3 text-green-400" />
                        ) : (
                          <MicOff className="w-3 h-3 text-red-400" />
                        )}
                        {participant.isInstructor && (
                          <Crown className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-medium ${
                      msg.isInstructor ? "text-yellow-400" : "text-blue-400"
                    }`}
                  >
                    {msg.sender}
                    {msg.isInstructor && (
                      <Crown className="w-3 h-3 inline ml-1" />
                    )}
                  </span>
                  <span className="text-xs text-gray-400">{msg.timestamp}</span>
                </div>
                <p className="text-sm text-gray-200">{msg.message}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              />
              <Button
                size="sm"
                onClick={sendMessage}
                className="bg-gradient-to-r from-[rgb(28,60,138)] to-[#02B7D5]"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex justify-center space-x-4">
          <Button
            size="lg"
            onClick={toggleAudio}
            className={`rounded-full w-12 h-12 ${
              isAudioOn
                ? "bg-gradient-to-r from-[rgb(28,60,138)] to-[#02B7D5]"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            {isAudioOn ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </Button>
          <Button
            size="lg"
            onClick={toggleVideo}
            className={`rounded-full w-12 h-12 ${
              isVideoOn
                ? "bg-gradient-to-r from-[rgb(28,60,138)] to-[#02B7D5]"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            {isVideoOn ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </Button>
          {isInstructor && (
            <Button
              size="lg"
              onClick={toggleScreenShare}
              className={`rounded-full w-12 h-12 ${
                isScreenSharing
                  ? "bg-gradient-to-r from-[rgb(28,60,138)] to-[#02B7D5]"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              <Monitor className="w-5 h-5" />
            </Button>
          )}
          {!isInstructor && (
            <Button
              size="lg"
              onClick={toggleHandRaise}
              className={`rounded-full w-12 h-12 ${
                isHandRaised
                  ? "bg-gradient-to-r from-[rgb(28,60,138)] to-[#02B7D5]"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              <Hand className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="lg"
            onClick={leaveClassroom}
            className="rounded-full w-12 h-12"
          >
            <Phone className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
