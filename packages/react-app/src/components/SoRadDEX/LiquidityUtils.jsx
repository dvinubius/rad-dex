const { ethers } = require("ethers");

export const expectedTokenAmountForDeposit = (depositValue, dexTokenBalance, dexEthBalance) => {
  const canCalc = depositValue && dexTokenBalance && dexEthBalance;
  if (!canCalc) throw "cannot calculate expected token for deposit";
  return depositValue.mul(dexTokenBalance).div(dexEthBalance).add(1);
};
export const depositForExpectedTokenAmount = (tokenAmountValue, dexTokenBalance, dexEthBalance) => {
  const canCalc = tokenAmountValue && dexTokenBalance && dexEthBalance;
  if (!canCalc) throw "cannot calculate deposit for expected token";
  return tokenAmountValue.sub(1).mul(dexEthBalance).div(dexTokenBalance);
};
export const maxDepositableEth = (userEthBalance, gasEstimate, userTokenBalance, dexTokenBalance, dexEthBalance) => {
  const canCalc = userEthBalance && gasEstimate && userTokenBalance && dexTokenBalance && dexEthBalance;
  if (!canCalc) return null;
  const maxCuzEthBalance = userEthBalance && gasEstimate && userEthBalance.sub(gasEstimate);
  const maxCuzTokenBalance = depositForExpectedTokenAmount(userTokenBalance, dexTokenBalance, dexEthBalance);
  const max = maxCuzEthBalance.gt(maxCuzTokenBalance) ? maxCuzTokenBalance : maxCuzEthBalance;
  return max.gt(0) ? max : ethers.BigNumber.from("0");
};
export const calcExpectedWithdrawOutput = (withdrawValue, dexEthBalance, dexTokenBalance, dexLiquidity) => {
  const canCalc = withdrawValue && dexEthBalance && dexTokenBalance && dexLiquidity;
  if (!canCalc) return null;
  return {
    ethPart: withdrawValue.mul(dexEthBalance).div(dexLiquidity),
    srtPart: withdrawValue.mul(dexTokenBalance).div(dexLiquidity),
  };
};
