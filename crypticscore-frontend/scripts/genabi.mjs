import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "RatingManager";

// Path to hardhat template
const hardhatPath = path.resolve("../fhevm-hardhat-template");

// Output directory
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const line = "\n===================================================================\n";

if (!fs.existsSync(hardhatPath)) {
  console.error(`${line}Unable to locate ${hardhatPath}${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(hardhatPath, "deployments");

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${chainDeploymentDir}' directory.\n\nPlease run: cd ../fhevm-hardhat-template && npx hardhat deploy --network ${chainName}${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);
  
  if (!fs.existsSync(contractFile)) {
    if (!optional) {
      console.error(`${line}Contract ${contractName}.json not found in ${chainDeploymentDir}${line}`);
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(contractFile, "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

// Read deployments
const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, false);

let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true);
if (!deploySepolia) {
  deploySepolia = { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
}

if (deployLocalhost && deploySepolia) {
  if (JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)) {
    console.error(
      `${line}Deployments on localhost and Sepolia differ. Please re-deploy contracts on both networks.${line}`
    );
    process.exit(1);
  }
}

// Generate ABI file
const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
\n`;

// Generate addresses file
const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");


