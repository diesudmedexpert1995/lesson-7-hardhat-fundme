// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers, getNamedAccounts} = require("hardhat");

async function main() {
  const deployer = ethers.provider.getSigner().address;
  fundMe = await ethers.getContractAt("FundMe", (await deployments.get("FundMe")).address, deployer); // most recently deployed fundme contract
  console.log(`Got contract FundMe at ${fundMe.target}`)
  console.log("Withdrawing from contract...")    
  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait();
  console.log("Go it back!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
