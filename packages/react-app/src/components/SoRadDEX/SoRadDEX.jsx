import React, { useMemo } from "react";
import { Button, Card, Divider, Input, Spin, Tabs } from "antd";
import { useBalance, useContractLoader, useContractReader } from "eth-hooks";
import { useEffect, useState } from "react";
import { LinkOutlined, SwapOutlined, ArrowDownOutlined } from "@ant-design/icons";

import "./SoRadDEX.css";
import "../Shared/FlexCard.css";
import CustomBalance from "../CustomKit/CustomBalance";
import { errorCol, softTextCol, swapGradient } from "../../styles";
import { exactFloatToFixed, printTPE } from "../../helpers/numeric";
import SectionTitle from "../CustomKit/SectionTitle";
import Liquidity from "./Liquidity";

const { ethers } = require("ethers");

const SoRadDEX = ({
  dexAddress,
  userTokenBalance,
  readContracts,
  writeContracts,
  contractConfig,
  localProvider,
  userSigner,
  price,
  gasPrice,
  tx,
  userAddress,
  userEthBalance,
  height,
  tokensPerEth,
  totalLiquidity,
  userLiquidity,
  updateEthInput,
  updateTokenInput,
}) => {
  const dexETHBalance = useBalance(localProvider, dexAddress);
  const dexApproval = useContractReader(readContracts, "SoRadToken", "allowance", [userAddress, dexAddress]);
  const dexTokenBalance = useContractReader(readContracts, "SoRadToken", "balanceOf", [dexAddress]);

  // ========== DERIVED & OWN STATE =========== //

  const [ethFormAmount, setEthFormAmount] = useState(); // text
  const [tokenFormAmount, setTokenFormAmount] = useState(); // text
  const [swapInValue, setSwapInValue] = useState(); // bn

  const [isBuyingToken, setIsBuyingToken] = useState(true); // swap direction

  const [amountError, setAmountError] = useState(); // error message
  const [isExecuting, setIsExecuting] = useState(false); // for swap button state

  useEffect(() => {
    const updateOutValue = async () => {
      if (!swapInValue) {
        return;
      }
      if (isBuyingToken) {
        // ETH => SRT, entering ETH
        const ethValue = swapInValue;
        const expectedTokenValue = await readContracts.SoRadDEX.price(ethValue, dexETHBalance, dexTokenBalance);
        setTokenFormAmount(printTPE(expectedTokenValue, 4));
      } else {
        // SRT => ETH, entering SRT
        const tokenValue = swapInValue;
        const expectedEthValue = await readContracts.SoRadDEX.price(tokenValue, dexTokenBalance, dexETHBalance);
        setEthFormAmount(printTPE(expectedEthValue, 4));
      }
    };

    if (readContracts && readContracts.SoRadDEX && dexETHBalance && dexTokenBalance && swapInValue) {
      updateOutValue();
    }
  }, [readContracts, dexETHBalance, dexTokenBalance, swapInValue, isBuyingToken]);

  const [isSellAmountApproved, setIsSellAmountApproved] = useState();

  useEffect(() => {
    if (isBuyingToken) {
      return;
    }
    if (!tokenFormAmount) {
      setIsSellAmountApproved(false);
      return;
    }

    console.log("tokenFormAmount", tokenFormAmount);
    const tokenFormAmountBN = tokenFormAmount && ethers.utils.parseEther("" + tokenFormAmount);
    console.log("tokenFormAmountBN", tokenFormAmountBN);
    setIsSellAmountApproved(dexApproval && tokenFormAmount && dexApproval.gte(tokenFormAmountBN));
  }, [tokenFormAmount, readContracts, dexApproval]);
  console.log("isSellAmountApproved", isSellAmountApproved);

  const hasValidTokenSellAmount = !isBuyingToken && swapInValue && swapInValue.gt("0");
  const swapAllowed = swapInValue && swapInValue.gt("0");

  const contracts = useContractLoader(localProvider, contractConfig);

  const dex = useMemo(() => {
    const { SoRadDEX } = contracts;
    return SoRadDEX && new ethers.Contract(SoRadDEX.address, SoRadDEX.interface, localProvider);
  }, [contractConfig, localProvider, contracts]);

  const [gasEstimateBuy, setGasEstimateBuy] = useState();
  const maxEthSpendable = userEthBalance && gasEstimateBuy && userEthBalance.sub(gasEstimateBuy);

  useEffect(() => {
    if (!dex || !gasPrice) return;
    const getEst = async () => {
      let est;
      try {
        est = await dex.connect(userSigner).estimateGas.buyTokens({ value: userEthBalance });
        console.log("estimated gas: ", est.toString());
      } catch (e) {
        console.log("failed gas estimation");
        est = "0";
      }
      const gasCostEstimate = ethers.BigNumber.from(gasPrice).mul(est);
      setGasEstimateBuy(gasCostEstimate);
      console.log("estimated gas cost: ", ethers.utils.formatEther(gasCostEstimate.toString()).toString());
    };
    getEst();
  }, [userEthBalance, gasPrice, dex]);

  // HACKY HACKY UPDATE

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const readyAll =
    dexETHBalance &&
    dexApproval &&
    dexTokenBalance &&
    userTokenBalance &&
    tokensPerEth &&
    userEthBalance &&
    maxEthSpendable;

  // =========== PIECES =========== //

  const _updateEthInput = ethAmount => {
    // NUMERIC VALIDITY
    if (ethAmount.length > 22) return;
    let ethValue = +ethAmount;
    if (isNaN(ethValue)) {
      return;
    }
    setEthFormAmount(ethAmount);
    updateEthInput(ethAmount);
    // VALUE VALIDITY
    if (ethValue === 0) {
      setSwapInValue(null);
      return;
    }
    const withPrecision = Math.round(ethValue * 10 ** 5);
    ethValue = ethers.BigNumber.from(withPrecision)
      .mul(ethers.utils.parseEther("1"))
      .div(10 ** 5);
    if (ethValue.lt("0")) {
      setAmountError("Invalid Input");
      setSwapInValue(null);
      return;
    }
    if (ethValue.gt(userEthBalance)) {
      setAmountError("You have insufficient ETH");
      setSwapInValue(null);
      return;
    }

    setSwapInValue(ethValue);
    setAmountError(null);
  };

  const _updateTokenInput = tokenAmount => {
    // NUMERIC VALIDITY
    if (tokenAmount.length > 22) return;
    let tokenValue = +tokenAmount;
    if (isNaN(tokenValue)) {
      return;
    }

    setTokenFormAmount(tokenAmount);
    updateTokenInput(tokenAmount);
    // VALUE VALIDITY
    if (tokenValue === 0) {
      setSwapInValue(null);
      return;
    }
    const withPrecision = Math.round(tokenValue * 10 ** 5);
    tokenValue = ethers.BigNumber.from(withPrecision)
      .mul(ethers.utils.parseEther("1"))
      .div(10 ** 5);
    if (tokenValue.lt("0")) {
      setAmountError("Invalid Input");
      setSwapInValue(null);
      return;
    }
    if (tokenValue.gt(userTokenBalance)) {
      setAmountError("You have insufficient SRT");
      setSwapInValue(null);
      return;
    }

    setSwapInValue(tokenValue);
    setAmountError(null);

    updateTokenInput(tokenAmount);
    const tokenSpendValue = tokenAmount ? ethers.utils.parseEther(tokenAmount) : null;
    setSwapInValue(tokenSpendValue);
  };

  const applyMaxEthAmount = () => {
    const ethAmount = exactFloatToFixed(ethers.utils.formatEther(maxEthSpendable), 2);
    _updateEthInput(ethAmount);
  };

  const applyMaxTokenAmount = () => {
    const tokenAmount = exactFloatToFixed(ethers.utils.formatEther(userTokenBalance), 2);
    _updateTokenInput(tokenAmount);
  };

  const _resetAfterSwap = () => {
    setIsExecuting(false);
    setEthFormAmount("");
    setTokenFormAmount("");
    updateTokenInput("");
    updateEthInput("");
    setSwapInValue(null);
    forceUpdate();
  };

  const swapEthForToken = async () => {
    setIsExecuting(true);

    await tx(writeContracts.SoRadDEX.ethToToken({ value: swapInValue }), update => {
      if (update && (update.error || update.reason)) {
        setIsExecuting(false);
      }
      if (update && (update.status === "confirmed" || update.status === 1)) {
        _resetAfterSwap();
      }
      if (update && update.code) {
        // metamask error etc.
        setIsExecuting(false);
      }
    });

    // use this instead of the updates above if the updates are unreliable
    // _resetAfterSwap();
  };

  const swapTokenForEth = isSellAmountApproved
    ? async () => {
        setIsExecuting(true);

        await tx(writeContracts.SoRadDEX.tokenToEth(swapInValue), update => {
          if (update && (update.error || update.reason)) {
            setIsExecuting(false);
          }
          if (update && (update.status === "confirmed" || update.status === 1)) {
            _resetAfterSwap();
          }
          if (update && update.code) {
            // metamask error etc.
            setIsExecuting(false);
          }
        });

        // use this instead of the updates above if the updates are unreliable
        // _resetAfterSwap();
      }
    : async () => {
        setIsExecuting(true);

        await tx(writeContracts.SoRadToken.approve(readContracts.SoRadDEX.address, swapInValue), update => {
          if (update && (update.error || update.reason)) {
            setIsExecuting(false);
          }
          if (update && (update.status === "confirmed" || update.status === 1)) {
            setIsExecuting(false);
            forceUpdate();
          }
          if (update && update.code) {
            // metamask error etc.
            setIsExecuting(false);
          }
        });

        // use this instead of the updates above if the updates are unreliable
        // setIsExecuting(false);
        // forceUpdate();
      };

  const swapButtonText = isBuyingToken
    ? "Swap"
    : isSellAmountApproved || !hasValidTokenSellAmount
    ? "Swap"
    : "Approve SRT";
  const inputForAsset = (asset, disabled) => (
    <Input
      size="large"
      disabled={disabled}
      style={{ textAlign: "left" }}
      prefix={<span style={{ marginRight: "0.5rem" }}>{asset === "eth" ? "ETH" : "SRT"}</span>}
      suffix={
        <span
          style={{
            color: softTextCol,
            marginRight: "0.5rem",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "opacity 0.1s ease-out",
          }}
          onClick={disabled ? null : asset === "eth" ? applyMaxEthAmount : applyMaxTokenAmount}
        >
          max{" "}
          <CustomBalance
            noClick
            etherMode={false}
            customSymbol=""
            size={16}
            padding={0}
            balance={asset === "eth" ? maxEthSpendable : userTokenBalance}
          />
        </span>
      }
      value={asset === "eth" ? ethFormAmount : tokenFormAmount}
      onChange={asset === "eth" ? e => _updateEthInput(e.target.value) : e => _updateTokenInput(e.target.value)}
      onPaste={e => e.preventDefault()}
    />
  );

  const toggleSwapDirection = () => {
    const newStateIsBuying = !isBuyingToken;
    setIsBuyingToken(newStateIsBuying);
    _resetAfterSwap();
    // if (newStateIsBuying) {
    //   updateTokenInput("");
    //   updateEthInput(ethFormAmount);
    // } else {
    //   updateTokenInput(tokenFormAmount);
    //   updateEthInput("");
    // }
  };

  const swapUI = (
    <>
      <div style={{ display: "flex", flexDirection: isBuyingToken ? "column" : "column-reverse" }}>
        {inputForAsset("eth", !isBuyingToken)}
        <div style={{ position: "relative", height: "0.75rem", width: "100%" }}>
          <div class="SwapArrow" onClick={toggleSwapDirection}>
            <ArrowDownOutlined style={{ padding: 0 }} />
          </div>
        </div>
        {inputForAsset("srt", isBuyingToken)}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        {amountError && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginTop: "0.8rem" }}>
            <div style={{ color: errorCol }}>{amountError}</div>
          </div>
        )}

        <Button
          style={{ alignSelf: "flex-end", width: "9rem", marginTop: "1rem", marginLeft: "auto" }}
          type={"primary"}
          size="large"
          disabled={!swapAllowed}
          loading={isExecuting}
          onClick={isBuyingToken ? swapEthForToken : swapTokenForEth}
        >
          {swapButtonText}
        </Button>
      </div>
    </>
  );

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
        title={
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <SectionTitle text="So Rad DEX" />{" "}
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
              <a href={`https://rinkeby.etherscan.io/address/${dexAddress}`} target="blank">
                <LinkOutlined />
              </a>
            </div>
          </div>
        }
        style={{ width: "30rem", margin: "auto", background: swapGradient, minHeight: height ?? "100%" }}
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
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}
          >
            {/* SWAP */}
            <div style={{ display: "flex", alignItems: "stretch", flexDirection: "column", width: "22rem" }}>
              <div>
                {priceDisplay}
                <div>{swapUI}</div>
              </div>
            </div>
            <div style={{ alignSelf: "stretch", marginTop: "1rem" }}>
              <Divider orientation="left">LIQUIDITY</Divider>

              <Liquidity
                totalLiquidity={totalLiquidity}
                userLiquidity={userLiquidity}
                tokenBalance={dexTokenBalance}
                ethBalance={dexETHBalance}
                readContracts={readContracts}
                localProvider={localProvider}
                writeContracts={writeContracts}
                userAddress={userAddress}
                tx={tx}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SoRadDEX;
