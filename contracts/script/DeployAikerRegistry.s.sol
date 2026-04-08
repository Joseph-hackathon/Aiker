// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AikerLaborRegistry.sol";

contract DeployAikerRegistry is Script {
    function run() external returns (AikerLaborRegistry registry) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        uint96 protocolFeeBps = uint96(vm.envOr("PROTOCOL_FEE_BPS", uint256(250)));

        vm.startBroadcast(deployerPrivateKey);
        registry = new AikerLaborRegistry(feeRecipient, protocolFeeBps);
        vm.stopBroadcast();
    }
}
