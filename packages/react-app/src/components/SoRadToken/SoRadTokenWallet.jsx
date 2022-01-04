import { LinkOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Input, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { errorCol, primaryCol, softTextCol } from "../../styles";
import CustomAddressInput from "../CustomKit/CustomAddressInput";
import CustomBalance from "../CustomKit/CustomBalance";
import SectionTitle from "../CustomKit/SectionTitle";
import SrtEthBalances from "../Shared/SrtEthBalances";
import "../Shared/FlexCard.css";
import { useContractLoader } from "eth-hooks";
const { ethers } = require("ethers");

const SoRadTokenWallet = ({
  tokenBalance,
  mainnetProvider,
  writeContracts,
  tx,
  userETHBalance,
  height,
  tokenAddress,
}) => {
  if (!tokenBalance) return "";

  const [tokenSendToAddress, setTokenSendToAddress] = useState();
  const [tokenSendAmount, setTokenSendAmount] = useState();
  const [tokenSendAmountParsed, setTokenSendAmountParsed] = useState();
  const [tokenSendAmountError, setTokenSendAmountError] = useState();

  const handleClickOnMax = () => {
    setTokenSendAmount((+ethers.utils.formatEther(tokenBalance)).toFixed(2));
  };

  const updateSendAmount = e => {
    let parsed;
    // NUMERIC VALIDITY
    const sendAmount = e.target.value;
    if (sendAmount.length > 22) return;
    parsed = sendAmount && ethers.utils.parseEther("" + sendAmount);

    if (isNaN(parsed)) {
      return;
    }
    setTokenSendAmount(sendAmount);
    // VALUE VALIDITY
    if (!parsed || (parsed.toNumber && parsed.eq("0"))) {
      setTokenSendAmountParsed(null);
      return;
    }
    if (parsed.lt("0")) {
      setTokenSendAmountError("Invalid Input");
      setTokenSendAmountParsed(null);
      return;
    }
    if (ethers.utils.parseEther(sendAmount).gt(tokenBalance)) {
      setTokenSendAmountError("Insufficient Balance");
      setTokenSendAmountParsed(null);
      return;
    }
    setTokenSendAmountParsed(parsed);
    setTokenSendAmountError(null);
  };

  const readyAll = tokenBalance && userETHBalance;

  return (
    <div
      style={{
        margin: "0",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
      }}
      className="FlexCardCol"
    >
      <Card
        title={
          <div
            style={{
              position: "relative",
              margin: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <SectionTitle
              text={
                <span>
                  Wallet <span style={{ opacity: 0.3, fontSize: "1rem" }}>{"(sort of)"}</span>
                </span>
              }
            />
            <div
              style={{
                position: "absolute",
                right: "0rem",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1.25rem",
              }}
            >
              <a href={`https://rinkeby.etherscan.io/address/${tokenAddress}`} target="blank">
                <LinkOutlined />
              </a>
            </div>{" "}
          </div>
        }
        style={{
          width: "23rem",
          margin: "auto",
          background: "linear-gradient(-45deg, #40A9FF0c, transparent)",
          height: height ?? "100%",
        }}
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
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div
                style={{
                  fontSize: "1rem",
                  display: "flex",
                  padding: "0.25rem 0",
                  alignItems: "center",
                  justifyContent: "center",
                  color: primaryCol,
                  borderTop: "1px solid rgba(24, 144, 255, 0.4)",
                  borderBottom: "1px solid rgba(24, 144, 255, 0.4)",
                  marginBottom: "4px",
                }}
              >
                <span style={{ marginRight: "0.5rem" }}>Send SRT</span> <SendOutlined />
              </div>
              <CustomAddressInput
                size="large"
                ensProvider={mainnetProvider}
                placeholder="send to address"
                value={tokenSendToAddress}
                onChange={setTokenSendToAddress}
              />

              <div style={{ position: "relative" }}>
                <Input
                  size="large"
                  style={{ textAlign: "left" }}
                  placeholder="amount to send"
                  prefix={<span style={{ color: softTextCol, marginRight: "0.5rem" }}>SRT</span>}
                  suffix={
                    <span
                      style={{ color: softTextCol, marginRight: "0.5rem", cursor: "pointer" }}
                      onClick={handleClickOnMax}
                    >
                      max{" "}
                      <CustomBalance
                        noClick
                        etherMode={false}
                        customSymbol=""
                        size={16}
                        padding={0}
                        balance={tokenBalance}
                      />
                    </span>
                  }
                  value={tokenSendAmount}
                  onChange={updateSendAmount}
                />
                {tokenSendAmountError && (
                  <div style={{ color: errorCol, position: "absolute" }}>{tokenSendAmountError}</div>
                )}
              </div>

              <Button
                style={{ alignSelf: "flex-end", width: "9rem", marginTop: "0.5rem" }}
                type={"primary"}
                size="large"
                disabled={!tokenSendToAddress || tokenSendAmountError}
                onClick={() => {
                  tx(writeContracts.SoRadToken.transfer(tokenSendToAddress, tokenSendAmountParsed));
                }}
              >
                Send
              </Button>
            </div>
            <div>
              <Divider orientation="left">My Balances</Divider>
              <SrtEthBalances tokenBalance={tokenBalance} ethBalance={userETHBalance} valuesColor={primaryCol} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
export default SoRadTokenWallet;
