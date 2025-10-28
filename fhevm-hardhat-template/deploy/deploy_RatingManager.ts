import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployment = await deploy("RatingManager", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`RatingManager deployed at: ${deployment.address}`);
};

export default func;
func.tags = ["RatingManager"];
func.dependencies = [];


