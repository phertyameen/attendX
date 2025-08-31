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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Users,
  Wallet,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { InstructorDashboard } from "@/components/instructor-dashboard";
import { StudentDashboard } from "@/components/student-dashboard";
import { Navbar } from "@/components/navbar";
import { useChainSwitcher } from "@/hooks/useChainSwitcher";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isCorrectChain, switchToLiskSepolia, isSwitching } =
    useChainSwitcher();
  const [userType, setUserType] = useState<"instructor" | "student" | null>(
    null
  );

  // Optional: Auto-reset userType on disconnect
  useEffect(() => {
    if (!isConnected) {
      setUserType(null);
    }
  }, [isConnected]);

  // Show network warning if not on Lisk Sepolia
  const NetworkWarning = () => {
    if (isCorrectChain) return null;

    return (
      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-800">
            You're not connected to Lisk Sepolia network. Please switch to use
            this app.
          </span>
          <Button
            onClick={switchToLiskSepolia}
            disabled={isSwitching}
            size="sm"
            variant="outline"
            className="ml-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            {isSwitching ? "Switching..." : "Switch to Lisk Sepolia"}
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

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
            <div className="text-xs text-muted-foreground text-center bg-blue-50 p-2 rounded">
              <strong>Note:</strong> This app requires connection to Lisk
              Sepolia network
            </div>
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
              <ConnectButton showBalance={false} chainStatus="full" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-4xl">
            <NetworkWarning />

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
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  !isCorrectChain ? "opacity-50 pointer-events-none" : ""
                }`}
                onClick={() => isCorrectChain && setUserType("instructor")}
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
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  !isCorrectChain ? "opacity-50 pointer-events-none" : ""
                }`}
                onClick={() => isCorrectChain && setUserType("student")}
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

            {!isCorrectChain && (
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Please switch to Lisk Sepolia network to continue
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If user has selected a role but is not on correct chain, show warning
  if (!isCorrectChain) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userType={userType} onDisconnect={() => disconnect()} />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NetworkWarning />
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Switch to Lisk Sepolia network to access the {userType} dashboard
            </p>
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
