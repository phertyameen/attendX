/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers";
import { getAttendanceContract } from "./contract";

// Get signer from wallet with better error handling
async function getSigner() {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask not installed. Please install MetaMask to continue."
    );
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    // Verify the signer is connected
    const address = await signer.getAddress();
    console.log("Connected wallet address:", address);

    return signer;
  } catch (error: any) {
    console.error("Failed to get signer:", error);
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
}

// Create session with better error handling and event parsing
export async function createSessionOnChain(name: string) {
  try {
    const signer = await getSigner();
    const contract = getAttendanceContract(signer);

    console.log("Creating session:", name);
    console.log("Contract address:", contract.target);

    // Estimate gas first
    const gasEstimate = await contract.createSession.estimateGas(name);
    console.log("Estimated gas:", gasEstimate.toString());

    // Send transaction with gas limit
    const tx = await contract.createSession(name, {
      gasLimit: (gasEstimate * BigInt(120)) / BigInt(100), // Add 20% buffer
    });

    console.log("Transaction sent:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.hash);

    return receipt;
  } catch (error: any) {
    console.error("Error creating session on-chain:", error);

    // More specific error handling
    if (error.code === "ACTION_REJECTED") {
      throw new Error("Transaction was rejected by user");
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("Insufficient funds for transaction");
    } else if (error.reason) {
      throw new Error(`Contract error: ${error.reason}`);
    } else {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }
}

// Register student with better error handling
export async function registerOnChain(sessionId: number) {
  try {
    const signer = await getSigner();
    const contract = getAttendanceContract(signer);

    console.log("Registering for session:", sessionId);

    // Check if already registered
    const address = await signer.getAddress();
    const isAlreadyRegistered = await contract.isRegistered(sessionId, address);

    if (isAlreadyRegistered) {
      throw new Error("Already registered for this session");
    }

    // Estimate gas
    const gasEstimate = await contract.register.estimateGas(sessionId);

    // Send transaction
    const tx = await contract.register(sessionId, {
      gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
    });

    console.log("Registration transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Registration confirmed:", receipt.hash);

    return receipt.hash;
  } catch (error: any) {
    console.error("Error registering on-chain:", error);

    if (error.code === "ACTION_REJECTED") {
      throw new Error("Registration was rejected by user");
    } else if (error.reason) {
      throw new Error(`Registration failed: ${error.reason}`);
    } else {
      throw new Error(`Failed to register: ${error.message}`);
    }
  }
}

// Check in with better error handling
export async function checkInOnChain(sessionId: number) {
  try {
    const signer = await getSigner();
    const contract = getAttendanceContract(signer);
    const address = await signer.getAddress();

    console.log("Checking in for session:", sessionId);

    // Verify registration first
    const isRegistered = await contract.isRegistered(sessionId, address);
    if (!isRegistered) {
      throw new Error("Not registered for this session");
    }

    // Check if already checked in
    const hasCheckedIn = await contract.hasCheckedIn(sessionId, address);
    if (hasCheckedIn) {
      throw new Error("Already checked in to this session");
    }

    // Estimate gas
    const gasEstimate = await contract.checkIn.estimateGas(sessionId);

    // Send transaction
    const tx = await contract.checkIn(sessionId, {
      gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
    });

    console.log("Check-in transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Check-in confirmed:", receipt.hash);

    return receipt.hash;
  } catch (error: any) {
    console.error("Error checking in on-chain:", error);

    if (error.code === "ACTION_REJECTED") {
      throw new Error("Check-in was rejected by user");
    } else if (error.reason) {
      throw new Error(`Check-in failed: ${error.reason}`);
    } else {
      throw new Error(`Failed to check in: ${error.message}`);
    }
  }
}

// Read session data
export async function getSession(sessionId: number) {
  try {
    const signer = await getSigner();
    const contract = getAttendanceContract(signer);

    const session = await contract.sessions(sessionId);

    return {
      name: session.name,
      timestamp: session.timestamp.toString(),
      instructor: session.instructor,
      totalStudents: session.totalStudents.toString(),
      attendanceCount: session.attendanceCount.toString(),
    };
  } catch (error: any) {
    console.error("Error reading session:", error);
    throw new Error(`Failed to read session: ${error.message}`);
  }
}

// Helper function to check contract connection
export async function testContractConnection() {
  try {
    const signer = await getSigner();
    const contract = getAttendanceContract(signer);

    // Try to read the session count
    const sessionCount = await contract.sessionCount();
    console.log("Current session count:", sessionCount.toString());

    return true;
  } catch (error) {
    console.error("Contract connection test failed:", error);
    return false;
  }
}

export async function getReadProvider() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  throw new Error("No provider found. Please install/connect a wallet.");
}

export async function getSessionCountOnChain() {
  const provider = await getReadProvider();
  const contract = getAttendanceContract(provider);
  const count = await contract.sessionCount();
  return Number(count);
}

export type OnChainSession = {
  id: string;
  name: string;
  timestamp: string; // ISO string
  instructor: string;
  totalStudents: number;
  attendanceCount: number;
};

export async function getSessionOnChain(
  sessionId: number
): Promise<OnChainSession> {
  const provider = await getReadProvider();
  const contract = getAttendanceContract(provider);
  const s = await contract.sessions(sessionId);
  return {
    id: String(sessionId),
    name: s.name,
    timestamp: new Date(Number(s.timestamp) * 1000).toISOString(),
    instructor: s.instructor,
    totalStudents: Number(s.totalStudents),
    attendanceCount: Number(s.attendanceCount),
  };
}

export async function getAllSessionsOnChain(): Promise<OnChainSession[]> {
  const n = await getSessionCountOnChain();
  const ids = Array.from({ length: n }, (_, i) => i);
  const sessions = await Promise.all(ids.map((i) => getSessionOnChain(i)));
  return sessions.sort((a, b) => Number(b.id) - Number(a.id));
}

// Check if a student is registered for a session (read-only)
export async function isRegisteredOnChain(
  sessionId: number,
  address: string
): Promise<boolean> {
  try {
    const provider = await getReadProvider();
    const contract = getAttendanceContract(provider);
    const registered = await contract.isRegistered(sessionId, address);
    return Boolean(registered);
  } catch (error: any) {
    console.error("Error checking registration:", error);
    throw new Error(`Failed to check registration: ${error.message}`);
  }
}

// Check if a student has checked in for a session (read-only)
export async function hasCheckedInOnChain(
  sessionId: number,
  address: string
): Promise<boolean> {
  try {
    const provider = await getReadProvider();
    const contract = getAttendanceContract(provider);
    const checkedIn = await contract.hasCheckedIn(sessionId, address);
    return Boolean(checkedIn);
  } catch (error: any) {
    console.error("Error checking check-in status:", error);
    throw new Error(`Failed to check check-in status: ${error.message}`);
  }
}
