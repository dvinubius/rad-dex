// deploy/01_deploy_vendor.js

const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const soRadToken = await ethers.getContract("SoRadToken", deployer);

  await deploy("SoRadDEX", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [soRadToken.address],
    log: true,
  });

  const dex = await ethers.getContract("SoRadDEX", deployer);

  const approval = await soRadToken.approve(
    dex.address,
    ethers.utils.parseEther("100")
  );
  await approval.wait();

  const init = await dex.init(ethers.utils.parseEther("0.1"), {
    value: ethers.utils.parseEther("0.1"),
  });
  await init.wait();

  // console.log("\n    ✅ confirming...\n");
  // await sleep(5000); // wait 5 seconds for transaction to propagate

  // ToDo: change address to your frontend address vvvv
  // console.log("\n 🤹  Sending ownership to frontend address...\n")
  // const ownershipTransaction = await vendor.transferOwnership("0x18fFE4dADcCe63A074Ef9cfe327cAb9AD4Ad9f76" );
  // console.log("\n    ✅ confirming...\n");
  // const ownershipResult = await ownershipTransaction.wait();

  // ToDo: Verify your contract with Etherscan for public chains
  // if (chainId !== "31337") {
  //   try {
  //     console.log(" 🎫 Verifing Contract on Etherscan... ");
  //     await sleep(5000); // wait 5 seconds for deployment to propagate
  //     await run("verify:verify", {
  //       address: vendor.address,
  //       contract: "contracts/Vendor.sol:Vendor",
  //       contractArguments: [yourToken.address],
  //     });
  //   } catch (e) {
  //     console.log(" ⚠️ Failed to verify contract on Etherscan ");
  //   }
  // }
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports.tags = ["Vendor"];
