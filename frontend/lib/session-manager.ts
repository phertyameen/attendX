import {
  registerOnChain,
  getAllSessionsOnChain,
  type OnChainSession,
  checkInOnChain,
  isRegisteredOnChain,
  hasCheckedInOnChain,
} from "./attendance";

export type Session = {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  duration: number;
  location: string;
  description: string;
  status: "upcoming" | "active" | "completed";
  studentStatus: "none" | "registered" | "checked-in";
  attendanceCount: number;
  totalStudents: number;
  createdAt: string;
  blockchainTxHash?: string;
  registeredStudents: Student[];
  endTime: string;
  createdBy?: string; // Add this field
};

export interface UserSession extends Session {
  isRegistered: boolean;
  hasCheckedIn: boolean;
}

export type Student = {
  id: string;
  name: string;
  walletAddress: string;
  checkedInAt: string;
  blockchainTxHash?: string;
};

type SessionMetadata = {
  startDate?: string;
  startTime?: string;
  duration?: number;
  location?: string;
  description?: string;
  endTime?: string;
  createdBy?: string;
  blockchainTxHash?: string;
};

// SessionManager with localStorage persistence
export class SessionManager {
  private static loadMetadata(): Record<string, SessionMetadata> {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem("sessionMetadata");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  private static saveMetadata(meta: Record<string, SessionMetadata>) {
    if (typeof window === "undefined") return;
    localStorage.setItem("sessionMetadata", JSON.stringify(meta));
  }

  static async upsertMetadata(sessionId: string, metadata: SessionMetadata) {
    const all = this.loadMetadata();
    all[sessionId] = { ...(all[sessionId] || {}), ...metadata };
    this.saveMetadata(all);
  }

  private static composeSession(
    on: OnChainSession,
    meta: SessionMetadata = {},
    studentStatus: "none" | "registered" | "checked-in" = "none"
  ): Session {
    const createdAt = on.timestamp; // ISO from chain
    const title = on.name || `Session #${on.id}`;

    // derive status from metadata time if present
    const startDate = meta.startDate || "";
    const startTime = meta.startTime || "";
    const duration = meta.duration ?? 60;

    let status: Session["status"] = "upcoming";
    if (startDate && startTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(start.getTime() + duration * 60000);
      const now = new Date();
      if (now >= start && now < end) status = "active";
      else if (now >= end) status = "completed";
    }

    return {
      id: on.id,
      title,
      startDate,
      startTime,
      duration,
      location: meta.location || "",
      description: meta.description || "",
      status,
      studentStatus,
      attendanceCount: on.attendanceCount,
      totalStudents: on.totalStudents,
      createdAt,
      blockchainTxHash: meta.blockchainTxHash,
      registeredStudents: [], // we don’t store full roster off-chain here
      endTime: meta.endTime || "",
      createdBy: meta.createdBy,
    };
  }

  static async createSession(args: {
    sessionId: string;
    txHash: string;
    title: string;
    startDate?: string;
    startTime?: string;
    duration?: number;
    location?: string;
    description?: string;
    createdBy?: string;
  }) {
    const {
      sessionId,
      txHash,
      startDate,
      startTime,
      duration,
      location,
      description,
      createdBy,
    } = args;

    // Save metadata in localStorage
    await this.upsertMetadata(sessionId, {
      startDate,
      startTime,
      duration,
      location,
      description,
      createdBy,
      blockchainTxHash: txHash,
    });

    // Return composed session from on-chain + metadata
    const all = await this.getAllSessions();
    const found = all.find((s) => s.id === sessionId);
    if (!found) throw new Error("Session not found after creation.");
    return found;
  }

  static async registerForSession(sessionId: string): Promise<string> {
    const txHash = await registerOnChain(Number(sessionId));
    console.log(`Registered for session ${sessionId} (tx: ${txHash})`);
    return txHash;
  }

  static async updateSession(sessionId: string, updates: Partial<Session>) {
    // updates are purely metadata (date/time/location/description)
    const allowed: SessionMetadata = {
      startDate: updates.startDate,
      startTime: updates.startTime,
      duration: updates.duration,
      location: updates.location,
      description: updates.description,
      endTime: updates.endTime,
    };
    await this.upsertMetadata(sessionId, allowed);
    const all = await this.getAllSessions();
    return all.find((s) => s.id === sessionId) || null;
  }

  static async getSessionById(sessionId: string) {
    const all = await this.getAllSessions();
    return all.find((s) => s.id === sessionId) || null;
  }

  static async checkInToSession(sessionId: string): Promise<string> {
    const txHash = await checkInOnChain(Number(sessionId));
    console.log(`Checked in to session ${sessionId} (tx: ${txHash})`);
    return txHash;
  }

  static async getStudentStatus(
    sessionId: number,
    address: string
  ): Promise<"none" | "registered" | "checked-in"> {
    const [registered, checkedIn] = await Promise.all([
      isRegisteredOnChain(sessionId, address),
      hasCheckedInOnChain(sessionId, address),
    ]);
    if (checkedIn) return "checked-in";
    if (registered) return "registered";
    return "none";
  }

  static async getAllSessions(address?: string): Promise<Session[]> {
    const onChain = await getAllSessionsOnChain();
    const meta = this.loadMetadata();

    return Promise.all(
      onChain.map(async (oc) => {
        const studentStatus = address
          ? await this.getStudentStatus(Number(oc.id), address)
          : "none";
        return this.composeSession(oc, meta[oc.id], studentStatus);
      })
    );
  }
}
