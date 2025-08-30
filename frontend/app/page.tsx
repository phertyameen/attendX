"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Wallet, BookOpen } from "lucide-react";
import { InstructorDashboard } from "@/components/instructor-dashboard";
import { StudentDashboard } from "@/components/student-dashboard";
import { Navbar } from "@/components/navbar";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [userType, setUserType] = useState<"instructor" | "student" | null>(
    null
  );

  // Optional: Auto-reset userType on disconnect
  useEffect(() => {
    if (!isConnected) {
      setUserType(null);
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-r from-[rgb(28,60,138)] to-[#02B7D5] rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">AttendX</CardTitle>
            <CardDescription>
              Connect your wallet to access the decentralized attendance
              platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-max m-auto pb-3">
              <ConnectButton showBalance={false} chainStatus="icon" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Secure blockchain-based attendance tracking for educational
              institutions
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userType) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[rgb(28,60,138)] to-[#02B7D5] rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">AttendX</h1>
                  <p className="text-xs text-muted-foreground">
                    Decentralized Attendance
                  </p>
                </div>
              </div>
              <ConnectButton showBalance={false} chainStatus="none"  />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Choose Your Role
              </h1>
              <p className="text-muted-foreground">
                Select how you want to use the platform
              </p>
              <Badge variant="secondary" className="mt-2 text-white">
                <Wallet className="w-3 h-3 mr-1" />
                Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setUserType("instructor")}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">
                    Instructor Dashboard
                  </CardTitle>
                  <CardDescription>
                    Create sessions and share registration links
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Create attendance sessions</li>
                    <li>• Share session registration links</li>
                    <li>• View real-time attendance data</li>
                    <li>• Sessions auto-close at end time</li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setUserType("student")}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Student Dashboard</CardTitle>
                  <CardDescription>
                    Register for sessions and check in when active
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Register for sessions via links</li>
                    <li>• Check in when sessions are active</li>
                    <li>• View attendance history</li>
                    <li>• Track session participation</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} onDisconnect={() => disconnect()} />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userType === "instructor" ? (
          <InstructorDashboard />
        ) : (
          <StudentDashboard />
        )}
      </main>
    </div>
  );
}
