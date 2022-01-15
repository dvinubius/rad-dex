import React, { useState } from "react";
import { useBalance } from "eth-hooks";
import { exactFloatToFixed } from "../../helpers/numeric";
import "./CustomBalance.css";

const { utils } = require("ethers");

/*
  Based on Balance component from scaffold-eth buidl kit
  Changed so that 
  - it can be initialized in etherMode via props
  - padding is customizable
  - decimals customizable
  - in etherMode it also displays the eth symbol
  - toggle price on click can be disabled via noClick prop
  - custom symbol can be used to represent currency (token ticker symbols etc.)

  - MUST PROVIDE balance or value as prop, it should be available in parent component => one less call to rpc node
*/

export default function CustomBalance({
  value,
  balance,
  price,
  etherMode,
  decimals,
  dollarMultiplier,
  customSymbol,
  customColor,
  noClick,
  size,
  padding,
}) {
  const [dollarMode, setDollarMode] = useState(!etherMode);

  const dollarDecimals = decimals ?? 2;
  const ethDecimals = decimals ?? 4;

  let floatBalance = parseFloat("0.00");
  let usingBalance;

  if (typeof balance !== "undefined") usingBalance = balance;
  if (typeof value !== "undefined") usingBalance = value;

  if (usingBalance) {
    const etherBalance = utils.formatEther(usingBalance);
    parseFloat(etherBalance).toFixed(dollarDecimals);
    floatBalance = parseFloat(etherBalance);
  }

  let displayBalance = exactFloatToFixed(floatBalance, ethDecimals);

  const priceToUse = price || dollarMultiplier || 1;
  const cursorType = !noClick ? "pointer" : "";

  if (dollarMode) {
    displayBalance = "$" + exactFloatToFixed(floatBalance * priceToUse, dollarDecimals);
  } else {
    displayBalance = "Ξ" + displayBalance;
  }

  if (customSymbol !== undefined) {
    displayBalance = `${customSymbol} ${displayBalance.substring(1)}`;
  }

  const handleClick = !noClick ? () => setDollarMode(!dollarMode) : null;

  return (
    <span
      className="CustomBalance"
      style={{
        verticalAlign: "middle",
        fontSize: size ? size : 24,
        padding: padding ?? 8,
        cursor: cursorType,
        color: customColor ?? "",
      }}
      onClick={handleClick}
    >
      {displayBalance}
    </span>
  );
}
