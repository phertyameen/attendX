/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers";
import AttendanceABI from "./abis/AttendanceABI.json";

const CONTRACT_ADDRESS = "0xf84fe45280161504B9e6EE321fF3b9492Cd0a70b";

export function getAttendanceContract(signerOrProvider: any) {
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    AttendanceABI.abi,
    signerOrProvider
  );
}
