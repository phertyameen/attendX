const hre = require("hardhat");

async function main() {
  const Attendance = await hre.ethers.getContractFactory("Attendance");
  const attendance = await Attendance.deploy();

  // Wait for the deployment to be mined
  await attendance.waitForDeployment();

  console.log(`Attendance contract deployed to: ${attendance.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});