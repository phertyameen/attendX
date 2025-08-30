"use client";

// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User } from "lucide-react";
// import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface NavbarProps {
  userType: "instructor" | "student";
  onDisconnect: () => void;
}

export function Navbar({ userType }: NavbarProps) {
  // const { address, isConnected } = useAccount();

  // Name fallback logic
  // const defaultName = userType === "instructor" ? "Instructor" : "Student";
  // const userName =
  //   userType === "instructor" ? "Dr. Sarah Johnson" : "Alex Chen";

  // Masked address helper
  // const maskAddress = (addr?: string) =>
  //   addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Not connected";

  return (
    <nav className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[rgb(28,60,138)] to-[#02B7D5] rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AttendX</h1>
              <p className="text-xs text-muted-foreground">Smart Attendance</p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="hidden sm:flex">
              <User className="w-3 h-3 mr-1" />
              {userType === "instructor" ? "Instructor" : "Student"}
            </Badge>

            {/* <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {maskAddress(address)}
                </p>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userType}`}
                  alt={userName}
                />
                <AvatarFallback>
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div> */}

            {/* <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              className="bg-red-600 text-white"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:ml-2 sm:inline">Disconnect</span>
            </Button> */}
            <ConnectButton showBalance={false} chainStatus="none" />
          </div>
        </div>
      </div>
    </nav>
  );
}
