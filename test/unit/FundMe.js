const {deployments, ethers, getNamedAccounts} = require("hardhat")
const {assert, expect} = require('chai')
const {developmentChains } = require("../../helper-hardhat-config.js")

!developmentChains.includes(network.name)?describe.skip:describe("FundMe", async function() {
	let fundMe;
	let deployer;
	let mockV3Aggregator;
	beforeEach(async function() {
		deployer = await ethers.provider.getSigner(); // or const deployer = await ethers.getSigners()[0];
		console.log("Deployer: "+deployer.address);
		await deployments.fixture(["all"]);
		//fundMe = await ethers.getContract("FundMe", deployer);
		//mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
		
		/*const mockV3AggregatorDeployment = await deployments.get("MockV3Aggregator")
		mockV3Aggregator = await ethers.getContractAt(
		     "MockV3Aggregator",
		     mockV3AggregatorDeployment.target,
		     deployer
		)*/
		fundMe = await ethers.getContractAt("FundMe", (await deployments.get("FundMe")).address, deployer); // most recently deployed fundme contract
        mockV3Aggregator = await ethers.getContractAt("MockV3Aggregator", (await deployments.get("MockV3Aggregator")).address, deployer)
		//console.log(mockV3Aggregator);
		
		/*const fundMeDeployment = await deployments.get("FundMe")
		fundMe = await ethers.getContractAt(
		     "FundMe",
		     fundMeDeployment.target,
		     deployer
		)*/
		//console.log(fundMe)
	})

	describe("constructor", async function(){
		it("set the aggregator address correctly", async function(){
			const response = await fundMe.getPriceFeed();
			assert.equal(response, mockV3Aggregator.target);
		})
	})

	describe("fund", async function(){
		it("Fails if you don`t funds correctly", async function(){
			await expect(fundMe.fund()).to.be.revertedWith("didn`t send enough funds")
		});

		it("Update the amount of funds correctly", async function(){
			const sendValue = ethers.parseEther("1");
			await fundMe.fund({value: sendValue})
			const deployerAddress = deployer.address
			const response = await fundMe.getFunderToAmount(deployerAddress);
			assert.equal(response.toString(), sendValue.toString());
		});
	})

	describe("withdraw", function(){
		beforeEach(async ()=>{
			await fundMe.fund({value: ethers.parseEther("1")});
		})
		it("withdraw ETH from single funder", async function(){
			const startingFundmeBalance = await ethers.provider.getBalance(fundMe.target);
			const startingDeployerBalance = await ethers.provider.getBalance(deployer);
			
			const transactionResponse = await fundMe.withdraw();
			const transactionReceipt = await transactionResponse.wait();
			const {gasUsed, gasPrice} = transactionReceipt;
			
			const gasCost = gasUsed*gasPrice;
			
			const endingFundmeBalance = await ethers.provider.getBalance(fundMe.target)
			const endingDeployerBalance = await ethers.provider.getBalance(deployer)
			assert.equal(endingFundmeBalance, 0);
			assert.equal(startingFundmeBalance+startingDeployerBalance, endingDeployerBalance+gasCost);
		})
	})
	it("is allows us to withdraw with multiple funders", async () => {
      // Arrange
      const accounts = await ethers.getSigners()
      for (i = 1; i < 6; i++) {
          const fundMeConnectedContract = await fundMe.connect(
              accounts[i]
          )
          await fundMeConnectedContract.fund({ value: ethers.parseEther("1") })
      }
      const startingFundMeBalance =
          await ethers.provider.getBalance(fundMe.target)
      const startingDeployerBalance =
          await ethers.provider.getBalance(deployer)

      // Act
      //const transactionResponse = await fundMe.cheaperWithdraw()
      // Let's comapre gas costs :)
      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait()
      const { gasUsed, gasPrice } = transactionReceipt
      const withdrawGasCost = gasUsed*gasPrice
      /*console.log(`GasCost: ${withdrawGasCost}`)
      console.log(`GasUsed: ${gasUsed}`)
      console.log(`GasPrice: ${effectiveGasPrice}`)*/
      const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
      )
      const endingDeployerBalance =
          await ethers.provider.getBalance(deployer)
      // Assert
      assert.equal(startingFundMeBalance+startingDeployerBalance, endingDeployerBalance+withdrawGasCost);
      
      // Make a getter for storage variables
      await expect(fundMe.getFunder(0)).to.be.reverted

      for (i = 1; i < 6; i++) {
          assert.equal(
              await fundMe.getFunderToAmount(
                  accounts[i].address
              ),
              0
          )
      }
  })
  it("Only allows the owner to withdraw", async function () {
      const accounts = await ethers.getSigners()
      const fundMeConnectedContract = await fundMe.connect(
          accounts[1]
      )
      //console.log(await fundMeConnectedContract.withdraw())
      await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith('Not owner');
  })

})	