pragma solidity 0.8.4;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SoRadToken is ERC20 {
    constructor() public ERC20("SoRadToken", "SRT") {
        _mint(msg.sender, 1000 * 10**18);
    }
}
