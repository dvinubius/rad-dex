pragma solidity 0.8.4;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SoRadDEX {
    string public purpose = "Swapping SRTs";
    IERC20 srts;

    constructor(address tokenAddress) public {
        srts = IERC20(tokenAddress);
    }

    uint256 public totalLiquidity;

    mapping(address => uint256) public liquidity;

    function init(uint256 tokens) public payable returns (uint256) {
        require(totalLiquidity == 0, "DEX:init - already has liquidity");
        totalLiquidity = address(this).balance;
        liquidity[msg.sender] = totalLiquidity;
        require(srts.transferFrom(msg.sender, address(this), tokens));
        return totalLiquidity;
    }

    function price(
        uint256 input_amount,
        uint256 input_reserve,
        uint256 output_reserve
    ) public pure returns (uint256) {
        uint256 input_amount_with_fee = input_amount * 997;
        uint256 numerator = input_amount_with_fee * output_reserve;
        uint256 denominator = input_reserve * 1000 + input_amount_with_fee;
        return numerator / denominator;
    }

    function ethToToken() public payable returns (uint256) {
        uint256 token_reserve = srts.balanceOf(address(this));
        uint256 tokens_bought = price(
            msg.value,
            address(this).balance - msg.value,
            token_reserve
        );
        require(srts.transfer(msg.sender, tokens_bought));
        return tokens_bought;
    }

    function tokenToEth(uint256 tokens) public returns (uint256) {
        uint256 token_reserve = srts.balanceOf(address(this));
        uint256 eth_bought = price(
            tokens,
            token_reserve,
            address(this).balance
        );
        payable(msg.sender).transfer(eth_bought);
        require(srts.transferFrom(msg.sender, address(this), tokens));
        return eth_bought;
    }

    function deposit() public payable returns (uint256) {
        uint256 eth_reserve = address(this).balance - msg.value;
        uint256 token_reserve = srts.balanceOf(address(this));
        uint256 token_amount = ((msg.value * token_reserve) / eth_reserve) + 1;
        uint256 liquidity_minted = (msg.value * totalLiquidity) / eth_reserve;
        liquidity[msg.sender] = liquidity[msg.sender] + liquidity_minted;
        totalLiquidity = totalLiquidity + liquidity_minted;
        require(srts.transferFrom(msg.sender, address(this), token_amount));
        return liquidity_minted;
    }

    function withdraw(uint256 amount) public returns (uint256, uint256) {
        uint256 token_reserve = srts.balanceOf(address(this));
        uint256 eth_amount = (amount * address(this).balance) / totalLiquidity;
        uint256 token_amount = (amount * token_reserve) / totalLiquidity;
        liquidity[msg.sender] = liquidity[msg.sender] - eth_amount;
        totalLiquidity = totalLiquidity - eth_amount;
        payable(msg.sender).transfer(eth_amount);
        require(srts.transfer(msg.sender, token_amount));
        return (eth_amount, token_amount);
    }
}
