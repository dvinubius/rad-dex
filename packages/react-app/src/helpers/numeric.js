const { ethers } = require("ethers");

export const exactFloatToFixed = (floatOrString, val) => {
  let ret = floatOrString.toString();
  if (ret.indexOf(".") === -1) {
    return ret;
  }
  ret = ret.slice(0, ret.indexOf(".") + val + 1);
  if (ret.indexOf(".") === -1) {
    ret = ret + "0000";
  } else {
    const decimals = ret.substr(ret.indexOf(".") + 1).length;
    if (decimals === 1) {
      ret = ret + "000";
    } else if (decimals === 2) {
      ret = ret + "00";
    } else if (decimals === 3) {
      ret = ret + "0";
    }
  }
  return ret;
};

export const printTPE = (tokensPerEth, precision = 2) => {
  const oneEth = ethers.utils.parseEther("1");
  const numTPE = tokensPerEth.mul(10 ** precision).div(oneEth);
  return "" + +numTPE.toString() / 10 ** precision;
};
