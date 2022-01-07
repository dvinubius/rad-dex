import React, { useContext } from "react";
import { Card, Divider, Spin } from "antd";
import { useState } from "react";
import { SwapOutlined } from "@ant-design/icons";

import "./SoRadDEX.css";
import "../Shared/FlexCard.css";
import { swapGradient } from "../../styles";
import { printTPE } from "../../helpers/numeric";
import SectionTitle from "../CustomKit/SectionTitle";
import Liquidity from "./Liquidity";
import SoRadIcon from "../SoRadToken/SoRadIcon";
import { DexContext } from "../DEX";
import { AppContext } from "../../App";
import SwapUI from "./SwapUI";
import TitleWithLink from "./TitleWithLink";

const { ethers } = require("ethers");

const SoRadDEX = ({ height }) => {
  const { userEthBalance } = useContext(AppContext);

  const { tokenAddress, dexAddress, dexTokenBalance, dexEthBalance, tokensPerEth, dexApproval, userTokenBalance } =
    useContext(DexContext);

  const swapWidthRem = 22;
  const dexWidthRem = 32;

  const readyAll =
    dexEthBalance && dexApproval && dexTokenBalance && userTokenBalance && tokensPerEth && userEthBalance;

  // =========== PIECES =========== //

  const [priceDirectionFromEth, setPriceDirectionFromEth] = useState(true);
  const togglePriceDirection = () => {
    setPriceDirectionFromEth(!priceDirectionFromEth);
  };
  const displayText =
    tokensPerEth &&
    (priceDirectionFromEth
      ? `${printTPE(tokensPerEth, 4)} SRT`
      : `${printTPE(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1")).div(tokensPerEth), 4)} ETH`);
  const priceDisplay = tokensPerEth && (
    <div
      onClick={togglePriceDirection}
      style={{
        fontSize: "1rem",
        color: "deeppink",
        fontWeight: 500,
        marginBottom: "1.5rem",
        padding: "0.25rem 0",
        borderTop: "1px solid rgba(255, 20, 147, 0.4)",
        borderBottom: "1px solid rgba(255, 20, 147, 0.4)",
        gap: "0.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <div>1 {priceDirectionFromEth ? "ETH" : "SRT"}</div>
      <SwapOutlined />
      <div> {displayText} </div>
    </div>
  );

  return (
    <div
      style={{
        margin: "0",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
      }}
      className="SoRadDEX FlexCardCol"
    >
      <Card
        style={{
          minWidth: `${dexWidthRem}rem`,
          margin: "auto",
          background: swapGradient,
          minHeight: height ?? "100%",
        }}
        title={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <TitleWithLink
              titleContent={
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <SoRadIcon size={28} />
                  <SectionTitle text="So Rad Token" />
                </div>
              }
              linkURL={`https://rinkeby.etherscan.io/address/${tokenAddress}`}
            />
            <TitleWithLink
              titleContent={<SectionTitle text="DEX" />}
              linkURL={`https://rinkeby.etherscan.io/address/${dexAddress}`}
            />
          </div>
        }
      >
        {!readyAll && (
          <div
            style={{
              height: "100%",
              margin: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin size="large" />
          </div>
        )}
        {readyAll && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* SWAP */}
            <div
              style={{ display: "flex", alignItems: "stretch", flexDirection: "column", width: `${swapWidthRem}rem` }}
            >
              <div>
                {priceDisplay}
                <SwapUI />
              </div>
            </div>
            <div style={{ alignSelf: "stretch", marginTop: "1rem" }}>
              <Divider orientation="left">LIQUIDITY</Divider>

              <Liquidity />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SoRadDEX;
