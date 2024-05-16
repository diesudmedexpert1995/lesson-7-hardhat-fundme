const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config.js")
const {verify} = require("../utils/verify.js")
require("dotenv").config();

module.exports = async ({getNamedAccounts, deployments})=>{
	const {deploy, log} = deployments
	const {deployer} = await getNamedAccounts()
	const chainId = network.config.chainId

	let ethUsdPriceFeedAddress;

	if(chainId == 31337){
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;

    }else{
    	ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeedAddress"];
    }

	log("Deploying FundMe...")
	const fundMe = await deploy("FundMe", {from: deployer, args:[ethUsdPriceFeedAddress], log: true})
	
	log("Deployed...")
	
	log("------------------------------------------------------------------")
	if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
		await verify(fundMe.address)
	}
}

module.exports.tags = ["all", "fundme"]