import { ArrowDownOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { ethers } from "ethers";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "../../App";
import { printTPE } from "../../helpers/numeric";
import { DexContext } from "../DEX";
import SwapInput from "./SwapInput";

const SwapUI = () => {
  const { readContracts, writeContracts, userSigner, gasPrice, tx, userEthBalance } = useContext(AppContext);

  const {
    dexTokenBalance,
    dexEthBalance,
    dexApproval,
    userTokenBalance,
    dexContract,
    setEthInputForCurve,
    setTokenInputForCurve,
  } = useContext(DexContext);

  // HACKY UPDATE
  const [, updateState] = React.useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [ethFormAmount, setEthFormAmount] = useState(); // text
  const [tokenFormAmount, setTokenFormAmount] = useState(); // text
  const [swapInValue, setSwapInValue] = useState(); // bn

  const [isBuyingToken, setIsBuyingToken] = useState(true); // swap direction

  const [amountError, setAmountError] = useState(); // error message
  const [isExecuting, setIsExecuting] = useState(false); // for swap button state
  const [isApproving, setIsApproving] = useState(false); // for swap button state

  useEffect(() => {
    const updateOutValue = async () => {
      if (!swapInValue) {
        return;
      }
      if (isBuyingToken) {
        // ETH => SRT, entering ETH
        const ethValue = swapInValue;
        const expectedTokenValue = await readContracts.SoRadDEX.price(ethValue, dexEthBalance, dexTokenBalance);
        setTokenFormAmount(printTPE(expectedTokenValue, 4));
      } else {
        // SRT => ETH, entering SRT
        const tokenValue = swapInValue;
        const expectedEthValue = await readContracts.SoRadDEX.price(tokenValue, dexTokenBalance, dexEthBalance);
        setEthFormAmount(printTPE(expectedEthValue, 4));
      }
    };

    if (readContracts && readContracts.SoRadDEX && dexEthBalance && dexTokenBalance && swapInValue) {
      updateOutValue();
    }
  }, [readContracts, dexEthBalance, dexTokenBalance, swapInValue, isBuyingToken]);

  const [isSellAmountApproved, setIsSellAmountApproved] = useState();

  useEffect(() => {
    if (isBuyingToken) {
      return;
    }
    if (!tokenFormAmount) {
      setIsSellAmountApproved(false);
      return;
    }
    const tokenFormAmountBN = tokenFormAmount && ethers.utils.parseEther("" + tokenFormAmount);
    setIsSellAmountApproved(dexApproval && tokenFormAmount && dexApproval.gte(tokenFormAmountBN));
  }, [tokenFormAmount, readContracts, dexApproval]);

  const hasValidTokenSellAmount = !isBuyingToken && swapInValue && swapInValue.gt("0");
  const swapAllowed = swapInValue && swapInValue.gt("0");

  const [gasEstimateBuy, setGasEstimateBuy] = useState();
  const maxEthSpendable = userEthBalance && gasEstimateBuy && userEthBalance.sub(gasEstimateBuy);

  useEffect(() => {
    if (!dexContract || !gasPrice) return;
    const getEst = async () => {
      let est;
      try {
        est = await dexContract.connect(userSigner).estimateGas.buyTokens({ value: userEthBalance });
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
  }, [userEthBalance, gasPrice, dexContract]);

  // UPDATES

  const toggleSwapDirection = () => {
    const newStateIsBuying = !isBuyingToken;
    setIsBuyingToken(newStateIsBuying);
    _resetAfterSwap();
  };

  const _updateEthInput = ethAmount => {
    if (ethAmount && ethAmount.startsWith(".")) {
      ethAmount = "0" + ethAmount;
    }
    // NUMERIC VALIDITY
    if (ethAmount.length > 22) return;
    let ethValue = +ethAmount;
    if (isNaN(ethValue)) {
      return;
    }
    setEthFormAmount(ethAmount);
    setEthInputForCurve(ethAmount);
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
    if (tokenAmount && tokenAmount.startsWith(".")) {
      tokenAmount = "0" + tokenAmount;
    }
    // NUMERIC VALIDITY
    if (tokenAmount.length > 22) return;
    let tokenValue = +tokenAmount;
    if (isNaN(tokenValue)) {
      return;
    }

    setTokenFormAmount(tokenAmount);
    setTokenInputForCurve(tokenAmount);
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
  };

  const applyMaxEthAmount = () => {
    const ethAmount = exactFloatToFixed(ethers.utils.formatEther(maxEthSpendable), 2);
    _updateEthInput(ethAmount);
  };

  const applyMaxTokenAmount = () => {
    const tokenAmount = exactFloatToFixed(ethers.utils.formatEther(userTokenBalance), 2);
    _updateTokenInput(tokenAmount);
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
        setIsApproving(true);

        await tx(writeContracts.SoRadToken.approve(readContracts.SoRadDEX.address, swapInValue), update => {
          if (update && (update.error || update.reason)) {
            setIsApproving(false);
          }
          if (update && (update.status === "confirmed" || update.status === 1)) {
            setIsApproving(false);
            forceUpdate();
          }
          if (update && update.code) {
            // metamask error etc.
            setIsApproving(false);
          }
        });

        // use this instead of the updates above if the updates are unreliable
        // setIsApproving(false);
        // forceUpdate();
      };

  const _resetAfterSwap = () => {
    setIsExecuting(false);
    setEthFormAmount("");
    setTokenFormAmount("");
    setTokenInputForCurve("");
    setEthInputForCurve("");
    setSwapInValue(null);
    forceUpdate();
  };

  const swapButtonText = isBuyingToken
    ? "Swap"
    : (isSellAmountApproved || !hasValidTokenSellAmount) && !isApproving
    ? "Swap"
    : "Approve SRT";

  const readyAll = maxEthSpendable;

  return !readyAll ? (
    <></>
  ) : (
    <div>
      <div style={{ display: "flex", flexDirection: isBuyingToken ? "column" : "column-reverse" }}>
        <SwapInput
          prefix="ETH"
          disabled={!isBuyingToken}
          maxInput={maxEthSpendable}
          onChange={e => _updateEthInput(e.target.value)}
          onApplyMax={applyMaxEthAmount}
          inputValue={ethFormAmount}
        />
        <div style={{ position: "relative", height: "0.75rem", width: "100%" }}>
          <div class="SwapArrow" onClick={toggleSwapDirection}>
            <ArrowDownOutlined style={{ padding: 0 }} />
          </div>
        </div>
        <SwapInput
          prefix="SRT"
          disabled={isBuyingToken}
          maxInput={userTokenBalance}
          onChange={e => _updateTokenInput(e.target.value)}
          onApplyMax={applyMaxTokenAmount}
          inputValue={tokenFormAmount}
        />
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
          loading={isExecuting || isApproving}
          onClick={isBuyingToken ? swapEthForToken : swapTokenForEth}
        >
          {swapButtonText}
        </Button>
      </div>
    </div>
  );
};

export default SwapUI;
