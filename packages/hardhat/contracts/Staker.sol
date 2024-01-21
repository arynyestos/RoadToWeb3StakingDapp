// SPDX-License-Identifier: MIT
pragma solidity 0.8.4; //Do not change the solidity version as it negativly impacts submission grading

import "hardhat/console.sol";
import "./ExampleExternalContract.sol";

contract Staker {
    ExampleExternalContract public exampleExternalContract;

    // Mappings
    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps;

    // Variables
    uint256 public constant rewardRatePerSecond = 0.1 ether;
    uint256 public withdrawalStartDate = block.timestamp + 120 seconds;
    uint256 public claimStartDate = block.timestamp + 240 seconds;
    uint256 public killTimeTS = 0;
    uint256 public threshold = 10 ether;

    // Events
    event Stake(address indexed sender, uint256 amount);
    event Received(address, uint256);
    event Execute(address indexed sender, uint256 amount);

    // Modifiers
    modifier withdrawalStartDateReached(bool requireReached) {
        uint256 timeRemaining = withdrawalTimeLeft();
        if (requireReached) {
            require(timeRemaining == 0, "Withdrawal period is not reached yet");
        } else {
            require(timeRemaining > 0, "Withdrawal period has been reached");
        }
        _;
    }

    modifier claimStartDateReached(bool requireReached) {
        uint256 timeRemaining = claimPeriodLeft();
        if (requireReached) {
            require(timeRemaining == 0, "Claim period is not reached yet");
        } else {
            require(timeRemaining > 0, "Claim period has been reached");
        }
        _;
    }

    modifier notCompleted() {
        bool completed = exampleExternalContract.completed();
        require(!completed, "Stake already completed!");
        _;
    }

    // Functions
    constructor(address exampleExternalContractAddress) {
        exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
    }

    function withdrawalTimeLeft() public view returns (uint256) {
        if (block.timestamp >= withdrawalStartDate - killTimeTS) {
            return (0);
        } else {
            return (withdrawalStartDate - block.timestamp);
        }
    }

    function claimPeriodLeft() public view returns (uint256) {
        if (block.timestamp >= claimStartDate - killTimeTS) {
            return (0);
        } else {
            return (claimStartDate - block.timestamp);
        }
    }

    // Stake function for a user to stake ETH in our contract
    function stake() public payable withdrawalStartDateReached(false) claimStartDateReached(false) {
        balances[msg.sender] = balances[msg.sender] + msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        emit Stake(msg.sender, msg.value);
    }

    // Withdraw function for a user to remove their staked ETH inclusive
    // of both the principle balance and any accrued interest
    function withdraw() public withdrawalStartDateReached(true) claimStartDateReached(false) notCompleted {
        require(balances[msg.sender] > 0, "You have no balance to withdraw!");
        uint256 individualBalance = balances[msg.sender];
        uint256 indBalanceRewards =
            individualBalance * (1 + ((block.timestamp - depositTimestamps[msg.sender]) * rewardRatePerSecond));
        balances[msg.sender] = 0;

        // Transfer all ETH via call! (not transfer) cc: https://solidity-by-example.org/sending-ether
        (bool sent,) = msg.sender.call{value: indBalanceRewards}("");
        require(sent, "RIP; withdrawal failed :( ");
    }

    // Allows any user to repatriate "unproductive" funds that are left in the staking contract
    // past the defined withdrawal period
    function execute() public claimStartDateReached(true) notCompleted {
        exampleExternalContract.complete{value: address(this).balance}();
    }

    // Time to "kill-time" on our local testnet
    function killTime() public {
        killTimeTS = block.timestamp;
    }

    // Function for our smart contract to receive ETH
    // cc: https://docs.soliditylang.org/en/latest/contracts.html#receive-ether-function
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
