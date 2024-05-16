// Allow users to send funds into contract
// Enable withdraw funds from contract by contract onwer
// Set minimum funding value in USD

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {PriceConverter} from "./PriceConverter.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//error FundMe__NotOwner();

// before update: 691543 gas (transaction cost), 596263 (execution cost) 
// first update:  668404 gas (transaction cost), 573350 (execution cost)
// second update: 645273 gas (trransaction cost), 550841 (execution cost)
contract FundMe {
    using PriceConverter for uint256;
    uint public constant MINIMUM_USD = 5; // first update (make constant - 23000 gas), second update (capitalize to constant-like view)
    address[] s_funders;
    mapping(address funder => uint256 amount) s_funderToAmount;

    address public /* immutable */ i_owner; // second update (make immutable - 417 gas, before - 2522 gas)
    AggregatorV3Interface public s_priceFeed;

    constructor(address priceFeedAddress_){
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress_);
    }

    modifier isOwner() {
        //require(msg.sender == i_owner, "Sender is not owner");
        if(msg.sender != i_owner) {
            revert("Not owner");
        }
        _;
    }

    function fund() payable public{
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "didn`t send enough funds");
        s_funders.push(msg.sender);
        s_funderToAmount[msg.sender] += msg.value;
    }
    function withdraw() public isOwner{
        uint256 funders_length = s_funders.length;
        for (uint256 funderIndex = 0; funderIndex < funders_length; funderIndex++) 
        {
            address funder = s_funders[funderIndex];
            s_funderToAmount[funder] = 0;
        }
        s_funders = new address[](0);

        (bool callSuccess, /*bytes memory data*/) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }
    
    receive() external payable { 
        fund();
    }

    fallback() external payable { 
        fund();
    }

    function getFunderToAmount(address funder_) public view returns(uint256){
        return s_funderToAmount[funder_];
    }

    function getFunder(uint index_) public view returns(address){
        return s_funders[index_];
    }

    function getVersion() public view returns (uint256) {
        return s_priceFeed.version();
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPriceFeed() public view returns(AggregatorV3Interface) {
        return s_priceFeed;
    }
}