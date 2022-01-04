import React, { useEffect, useMemo, useState } from "react";
import { Button, Input } from "antd";
import { errorCol, primaryCol, softTextCol } from "../../styles";
import { useContractLoader, useContractReader } from "eth-hooks";
import CustomBalance from "../CustomKit/CustomBalance";
import { exactFloatToFixed } from "../../helpers/numeric";
import { calcExpectedWithdrawOutput, expectedTokenAmountForDeposit, maxDepositableEth } from "./LiquidityUtils";
const { ethers } = require("ethers");

const LiquidityEdit = ({
  dexApproval,
  readContracts,
  writeContracts,
  localProvider,
  contractConfig,
  tx,
  userLiquidity,
  dexLiquidity,
  dexEthBalance,
  dexTokenBalance,
  userEthBalance,
  userTokenBalance,
  userSigner,
  gasPrice,
}) => {
  const [depositFormAmount, setDepositFormAmount] = useState(); // text
  const [withdrawFormAmount, setWithdrawFormAmount] = useState(); // text
  const [depositValue, setDepositValue] = useState(); // bn
  const [withdrawValue, setWithdrawValue] = useState(); // bn

  const expectedWithdrawOutput =
    withdrawValue &&
    dexEthBalance &&
    dexTokenBalance &&
    dexLiquidity &&
    calcExpectedWithdrawOutput(withdrawValue, dexEthBalance, dexTokenBalance, dexLiquidity);

  const [amountErrorDeposit, setAmountErrorDeposit] = useState(); // error message
  const [amountErrorWithdraw, setAmountErrorWithdraw] = useState(); // error message
  const [isExecutingDeposit, setIsExecutingDeposit] = useState(false); // for button state
  const [isExecutingWithdraw, setIsExecutingWithdraw] = useState(false); // for button state

  const [isDepositTransferApproved, setIsDepositTransferApproved] = useState();

  useEffect(() => {
    const canCalculate = depositValue && dexApproval && dexTokenBalance && dexEthBalance;
    if (!canCalculate) {
      setIsDepositTransferApproved(false);
      return;
    }
    const expectedTokenAmount = expectedTokenAmountForDeposit(depositValue, dexTokenBalance, dexEthBalance);
    setIsDepositTransferApproved(dexApproval.gte(expectedTokenAmount));
  }, [depositValue, dexApproval, dexTokenBalance, dexEthBalance]);

  const hasValidDepositAmount = depositValue && depositValue.gt("0");
  const depositAllowed = depositValue && depositValue.gt("0");
  const withdrawAllowed = withdrawValue && withdrawValue.gt("0");

  const contracts = useContractLoader(localProvider, contractConfig);

  const dex = useMemo(() => {
    const { SoRadDEX } = contracts;
    return SoRadDEX && new ethers.Contract(SoRadDEX.address, SoRadDEX.interface, localProvider);
  }, [contractConfig, localProvider, contracts]);

  const [gasEstimateDeposit, setGasEstimateDeposit] = useState();
  const maxEthDepositable = maxDepositableEth(
    userEthBalance,
    gasEstimateDeposit,
    userTokenBalance,
    dexTokenBalance,
    dexEthBalance,
  );

  useEffect(() => {
    if (!dex || !gasPrice) return;
    const getEst = async () => {
      let est;
      try {
        est = await dex.connect(userSigner).estimateGas.deposit({ value: userEthBalance });
        console.log("estimated gas: ", est.toString());
      } catch (e) {
        console.log("failed gas estimation");
        est = "0";
      }
      const gasCostEstimate = ethers.BigNumber.from(gasPrice).mul(est);
      setGasEstimateDeposit(gasCostEstimate);
      console.log("estimated gas cost: ", ethers.utils.formatEther(gasCostEstimate.toString()).toString());
    };
    getEst();
  }, [userEthBalance, gasPrice, dex]);

  // HACKY HACKY UPDATE

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const readyAll =
    dexEthBalance &&
    dexTokenBalance &&
    dexApproval &&
    userTokenBalance &&
    userEthBalance &&
    userLiquidity &&
    maxEthDepositable;

  // =========== PIECES =========== //

  const _updateDepositInput = ethAmount => {
    // NUMERIC VALIDITY
    if (ethAmount.length > 22) return;
    let ethValue = +ethAmount;
    if (isNaN(ethValue)) {
      return;
    }
    setDepositFormAmount(ethAmount);
    // VALUE VALIDITY
    if (ethValue === 0) {
      setAmountErrorDeposit(null);
      setDepositValue(null);
      return;
    }
    const withPrecision = Math.round(ethValue * 10 ** 5);
    ethValue = ethers.BigNumber.from(withPrecision)
      .mul(ethers.utils.parseEther("1"))
      .div(10 ** 5);
    if (ethValue.lt("0")) {
      setAmountErrorDeposit("Invalid Input");
      setDepositValue(null);
      return;
    }
    if (ethValue.gt(userEthBalance)) {
      setAmountErrorDeposit("You have insufficient ETH");
      setDepositValue(null);
      return;
    }
    const expectedTokenAmount = expectedTokenAmountForDeposit(ethValue, dexTokenBalance, dexEthBalance);
    if (expectedTokenAmount.gt(userTokenBalance)) {
      setAmountErrorDeposit("You have insufficient SRT");
      setDepositValue(null);
      return;
    }

    setDepositValue(ethValue);
    setAmountErrorDeposit(null);
  };

  const _updateWithdrawInput = withdrawAmount => {
    // NUMERIC VALIDITY
    if (withdrawAmount.length > 22) return;
    let withdrawValue = +withdrawAmount;
    if (isNaN(withdrawValue)) {
      return;
    }

    setWithdrawFormAmount(withdrawAmount);
    // VALUE VALIDITY
    if (withdrawValue === 0) {
      setWithdrawValue(null);
      setAmountErrorWithdraw(null);
      return;
    }
    const withPrecision = Math.round(withdrawValue * 10 ** 5);
    withdrawValue = ethers.BigNumber.from(withPrecision)
      .mul(ethers.utils.parseEther("1"))
      .div(10 ** 5);
    if (withdrawValue.lt("0")) {
      setAmountErrorWithdraw("Invalid Input");
      setWithdrawValue(null);
      return;
    }
    if (withdrawValue.gt(userLiquidity)) {
      setAmountErrorWithdraw("You have insufficient liquidity");
      setWithdrawValue(null);
      return;
    }

    setWithdrawValue(withdrawValue);
    setAmountErrorWithdraw(null);
  };

  const applyMaxDepositAmount = () => {
    const ethAmount = exactFloatToFixed(ethers.utils.formatEther(maxEthDepositable), 2);
    _updateDepositInput(ethAmount);
  };

  const applyMaxWithdrawAmount = () => {
    const ethAmount = exactFloatToFixed(ethers.utils.formatEther(userLiquidity), 2);
    _updateWithdrawInput(ethAmount);
  };

  const _resetAfterExecute = () => {
    setIsExecutingDeposit(false);
    setIsExecutingWithdraw(false);
    setDepositFormAmount("");
    setWithdrawFormAmount("");
    setWithdrawValue(null);
    setDepositValue(null);
    forceUpdate();
  };

  const liquidityInput = type => (
    <Input
      size="large"
      style={{ textAlign: "left" }}
      prefix={<span style={{ marginRight: "0.5rem" }}>{type === "deposit" ? "ETH" : "Ξ"}</span>}
      suffix={
        <span
          style={{
            color: softTextCol,
            marginRight: "0.5rem",
            cursor: "pointer",
            transition: "opacity 0.1s ease-out",
          }}
          onClick={type === "deposit" ? applyMaxDepositAmount : applyMaxWithdrawAmount}
        >
          max{" "}
          <CustomBalance
            noClick
            etherMode={false}
            customSymbol=""
            size={16}
            padding={0}
            balance={type === "deposit" ? maxEthDepositable : userLiquidity}
          />
        </span>
      }
      value={type === "deposit" ? depositFormAmount : withdrawFormAmount}
      onChange={
        type === "deposit" ? e => _updateDepositInput(e.target.value) : e => _updateWithdrawInput(e.target.value)
      }
      onPaste={e => e.preventDefault()}
    />
  );

  const liquidityInputButton = type => {
    const needTransferApproval = isDepositTransferApproved || !hasValidDepositAmount;
    const buttonText = type === "deposit" ? (needTransferApproval ? "Deposit" : "Approve") : "Withdraw";
    const buttonAction =
      type === "deposit" ? (needTransferApproval ? approveDepositTransfer : executeDeposit) : executeWithdraw;
    return (
      <Button
        style={{ width: "7rem", flexShrink: 0 }}
        type={"primary"}
        size="large"
        disabled={type === "deposit" ? !depositAllowed : !withdrawAllowed}
        loading={type === "deposit" ? isExecutingDeposit : isExecutingWithdraw}
        onClick={buttonAction}
      >
        {buttonText}
      </Button>
    );
  };

  const liquidityInputError = type => {
    const error = type === "deposit" ? amountErrorDeposit : amountErrorWithdraw;
    if (!error) return <></>;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <div style={{ color: errorCol }}>{error}</div>
          </div>
        )}
      </div>
    );
  };

  const assetBalance = (asset, value) => (
    <span
      style={{
        // color: softTextCol,
        color: primaryCol,
        transition: "opacity 0.1s ease-out",
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        // fontSize: "1rem",
      }}
    >
      <div>{asset === "eth" ? "ETH" : "SRT"}</div>
      <CustomBalance noClick etherMode={false} customSymbol="" size={14} padding={0} balance={value} decimals={4} />
    </span>
  );

  const withdrawOutputDisplay = () => {
    if (!expectedWithdrawOutput) return <></>;
    const { ethPart, srtPart } = expectedWithdrawOutput;
    return (
      <div style={{ display: "flex", gap: "1rem", padding: "0 0.25rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexGrow: 1,
            color: softTextCol,
            opacity: 0.8,
          }}
        >
          {assetBalance("eth", ethPart)}- Receive -{assetBalance("srt", srtPart)}
        </div>
        <div style={{ width: "7rem" }}>{""}</div>
      </div>
    );
  };

  const liquidityForm = type => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "stretch" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {liquidityInput(type)}
          {liquidityInputButton(type)}
        </div>
        {type === "withdraw" ? withdrawOutputDisplay() : <></>}
        {liquidityInputError(type)}
      </div>
    );
  };

  const userBalances = (
    <div style={{ display: "flex", gap: "1rem", padding: "0 0.25rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexGrow: 1,
          color: softTextCol,
          opacity: 0.8,
        }}
      >
        {assetBalance("eth", userEthBalance)}- Balance -{assetBalance("srt", userTokenBalance)}
      </div>
      <div style={{ width: "7rem" }}>{""}</div>
    </div>
  );

  const approveDepositTransfer = async () => {
    setIsExecutingDeposit(true);

    const expectedTokenAmount = expectedTokenAmountForDeposit(depositValue, dexTokenBalance, dexEthBalance);

    await tx(writeContracts.SoRadToken.approve(readContracts.SoRadDEX.address, expectedTokenAmount), update => {
      if (update && (update.error || update.reason)) {
        setIsExecutingDeposit(false);
      }
      if (update && (update.status === "confirmed" || update.status === 1)) {
        setIsExecutingDeposit(false);
        forceUpdate();
      }
      if (update && update.code) {
        // metamask error etc.
        setIsExecutingDeposit(false);
      }
    });
  };

  const executeDeposit = async () => {
    setIsExecutingDeposit(true);

    await tx(writeContracts.SoRadDEX.deposit({ value: depositValue }), update => {
      if (update && (update.error || update.reason)) {
        setIsExecutingDeposit(false);
      }
      if (update && (update.status === "confirmed" || update.status === 1)) {
        _resetAfterExecute();
      }
      if (update && update.code) {
        // metamask error etc.
        setIsExecutingDeposit(false);
      }
    });
  };

  const executeWithdraw = async () => {
    setIsExecutingWithdraw(true);

    await tx(writeContracts.SoRadDEX.withdraw({ value: withdrawValue }), update => {
      if (update && (update.error || update.reason)) {
        setIsExecutingWithdraw(false);
      }
      if (update && (update.status === "confirmed" || update.status === 1)) {
        _resetAfterExecute();
      }
      if (update && update.code) {
        // metamask error etc.
        setIsExecutingWithdraw(false);
      }
    });
  };

  return (
    <div style={{ width: "26rem", margin: "1rem auto 0" }}>
      {readyAll && (
        <>
          <div style={{ marginBottom: "0.25rem" }}>{userBalances}</div>
          <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
            {liquidityForm("deposit")}
            {liquidityForm("withdraw")}
          </div>
        </>
      )}
    </div>
  );
};

export default LiquidityEdit;
