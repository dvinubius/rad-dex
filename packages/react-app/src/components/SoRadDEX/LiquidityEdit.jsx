import React, { useContext, useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Tooltip } from "antd";
import { errorColor, nestedCardBGDark, nestedCardBGLight, primaryColor, softTextColor } from "../../styles";
import CustomBalance from "../CustomKit/CustomBalance";
import { exactFloatToFixed } from "../../helpers/numeric";
import { calcExpectedWithdrawOutput, expectedTokenAmountForDeposit, maxDepositableEth } from "./LiquidityUtils";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { DexContext } from "../DEX";
import { AppContext, ThemeContext } from "../../App";
const { ethers } = require("ethers");

const LiquidityEdit = () => {
  const { readContracts, writeContracts, tx, userEthBalance, gasPrice } = useContext(AppContext);

  const { dexTokenBalance, dexEthBalance, dexApproval, userTokenBalance, userLiquidity, dexLiquidity } =
    useContext(DexContext);

  const { theme } = useContext(ThemeContext);

  const isLightTheme = theme === "light";
  const totalWidthRem = 30;
  const rightColWidthRem = 7.5;

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

  const [gasEstimateDeposit, setGasEstimateDeposit] = useState();
  const maxEthDepositable = maxDepositableEth(
    userEthBalance,
    gasEstimateDeposit,
    userTokenBalance,
    dexTokenBalance,
    dexEthBalance,
  );

  useEffect(() => {
    if (!gasPrice) return;
    const getEst = async () => {
      // 30 000  for  approval. to be safe with the estimate we always include this gas cost even if an approval won't be necessary
      let est = 30000;
      try {
        // hardcoding tx cost because:
        // estimate is not possible without having approval first
        // executing with 0 ether also errors because even a 0 eth deposit involves a token transfer of 1 wei
        // est = await dexContract.connect(userSigner).estimateGas.deposit({ value: ethers.utils.parseEther(maxEthDepositable) });
        est = 80000;
        console.log("estimated gas: ", est.toString());
      } catch (e) {
        console.error("failed gas estimation");
        est = "0";
      }
      const gasCostEstimate = ethers.BigNumber.from(gasPrice).mul(est);
      setGasEstimateDeposit(gasCostEstimate);
      console.log("estimated gas cost: ", ethers.utils.formatEther(gasCostEstimate.toString()).toString());
    };
    getEst();
  }, [userEthBalance, gasPrice]);

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
    if (ethAmount && ethAmount.startsWith(".")) {
      ethAmount = "0" + ethAmount;
    }
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
    if (withdrawAmount && withdrawAmount.startsWith(".")) {
      withdrawAmount = "0" + withdrawAmount;
    }
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
    const ethAmount = exactFloatToFixed(ethers.utils.formatEther(maxEthDepositable), 5);
    _updateDepositInput(ethAmount);
  };

  const applyMaxWithdrawAmount = () => {
    const ethAmount = exactFloatToFixed(ethers.utils.formatEther(userLiquidity), 4);
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

  const liquidityInput = type => {
    const isDisabled = type === "withdraw" && userLiquidity && userLiquidity.eq(0);
    const suffixBalanceCol = type === "deposit" || isDisabled ? softTextColor : primaryColor;
    return (
      <Input
        size="large"
        style={{ textAlign: "left" }}
        // placeholder={type === "deposit" ? "deposit amount" : "withdraw liquidity"}
        disabled={isDisabled}
        prefix={
          <span style={{ marginRight: "0.5rem" }}>
            {type === "deposit" ? (
              "ETH"
            ) : (
              <span style={{ color: isDisabled ? softTextColor : primaryColor }}>
                <span>Ξ</span>
                {/* <span style={{ visibility: "hidden" }}>T</span>
              <span style={{ visibility: "hidden" }}>H</span> */}
              </span>
            )}
          </span>
        }
        suffix={
          <span
            style={{
              color: softTextColor,
              cursor: "pointer",
              transition: "opacity 0.1s ease-out",
            }}
            onClick={type === "deposit" ? applyMaxDepositAmount : applyMaxWithdrawAmount}
          >
            max{" "}
            <span style={{ color: suffixBalanceCol }}>
              <CustomBalance
                noClick
                etherMode={false}
                customSymbol=""
                size={16}
                padding={0}
                balance={type === "deposit" ? maxEthDepositable : userLiquidity}
              />
            </span>
          </span>
        }
        value={type === "deposit" ? depositFormAmount : withdrawFormAmount}
        onChange={
          type === "deposit" ? e => _updateDepositInput(e.target.value) : e => _updateWithdrawInput(e.target.value)
        }
        onPaste={e => e.preventDefault()}
      />
    );
  };

  const liquidityInputButton = type => {
    const needTransferApproval = hasValidDepositAmount && !isDepositTransferApproved;
    const buttonText = type === "deposit" ? (needTransferApproval ? "Approve" : "Deposit") : "Withdraw";
    const buttonAction =
      type === "deposit" ? (needTransferApproval ? approveDepositTransfer : executeDeposit) : executeWithdraw;
    const expectedTransferAmount =
      needTransferApproval && dexTokenBalance && dexEthBalance && depositValue
        ? expectedTokenAmountForDeposit(depositValue, dexTokenBalance, dexEthBalance)
        : 0;
    return (
      <div style={{ position: "relative" }}>
        <Button
          style={{ width: `${rightColWidthRem}rem`, flexShrink: 0 }}
          type={"primary"}
          size="large"
          disabled={type === "deposit" ? !depositAllowed : !withdrawAllowed}
          loading={type === "deposit" ? isExecutingDeposit : isExecutingWithdraw}
          onClick={buttonAction}
        >
          {buttonText}
        </Button>
        {type === "deposit" && expectedTransferAmount !== 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "-1.5rem",
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.25rem",
              color: primaryColor,
              opacity: 0.8,
              fontSize: "0.875rem",
            }}
          >
            {assetBalance("srt", expectedTransferAmount, undefined, primaryColor)}
          </div>
        )}
      </div>
    );
  };

  const liquidityInputError = type => {
    const error = type === "deposit" ? amountErrorDeposit : amountErrorWithdraw;
    if (!error) return <></>;
    return (
      <div
        style={{
          position: "absolute",
          bottom: "-1.5rem",
          left: 0,
        }}
      >
        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <div style={{ color: errorColor }}>{error}</div>
          </div>
        )}
      </div>
    );
  };

  const liquidityInputHelp = type => {
    const help =
      type === "deposit" ? (
        <div style={{ paddingTop: "0.5rem" }}>
          <div>
            <strong>DEPOSIT</strong>
          </div>
          <p>The maximum amount depends on both your available ETH and SRT</p>
          <div>
            <strong>WITHDRAW</strong>
          </div>
          <p>You input the liquidity and receive ETH and SRT amounts according to the current pool state.</p>
        </div>
      ) : (
        ""
      );
    if (!help) return <></>;
    const tooltipBG = isLightTheme ? "white" : "black";
    const tooltipCol = isLightTheme ? "#111" : "#eee";
    return (
      <div
        style={{
          position: "absolute",
          bottom: "-1.5rem",
          right: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <Tooltip
            title={help}
            overlayInnerStyle={{ width: "22rem", backgroundColor: tooltipBG, color: tooltipCol, opacity: 0.9 }}
          >
            <QuestionCircleOutlined style={{ fontSize: "0.875rem", flexGrow: 1, color: softTextColor }} />
          </Tooltip>
          <div style={{ width: `${rightColWidthRem}rem` }}></div>
        </div>
      </div>
    );
  };

  const assetBalance = (asset, value, fontSize = 14, color = softTextColor) => (
    <span
      style={{
        color: color,
        transition: "opacity 0.1s ease-out",
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        // fontSize: "1rem",
      }}
    >
      <div>{asset === "eth" ? "ETH" : "SRT"}</div>
      <CustomBalance
        noClick
        etherMode={false}
        customSymbol=""
        size={fontSize}
        padding={0}
        balance={value}
        decimals={4}
      />
    </span>
  );

  const withdrawOutputDisplay = () => {
    if (!expectedWithdrawOutput) return <></>;
    const { ethPart, srtPart } = expectedWithdrawOutput;
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "-1.5rem",
          display: "flex",
          gap: "1rem",
          padding: "0 0.25rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexGrow: 1,
            color: softTextColor,
            opacity: 0.8,
          }}
        >
          {assetBalance("eth", ethPart, undefined, primaryColor)}- Receive -
          {assetBalance("srt", srtPart, undefined, primaryColor)}
        </div>
        <div style={{ width: `${rightColWidthRem}rem` }}>{""}</div>
      </div>
    );
  };

  const liquidityForm = type => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          alignItems: "stretch",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {liquidityInput(type)}
          {liquidityInputButton(type)}
        </div>
        {type === "withdraw" ? withdrawOutputDisplay() : <></>}
        {liquidityInputError(type)}
        {liquidityInputHelp(type)}
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
          color: softTextColor,
          opacity: 0.8,
        }}
      >
        {assetBalance("eth", userEthBalance)}- Available -{assetBalance("srt", userTokenBalance)}
      </div>
      <div style={{ width: `${rightColWidthRem}rem` }}>{""}</div>
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

    await tx(writeContracts.SoRadDEX.deposit({ value: depositValue, gasLimit: 200000 }), update => {
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
    await tx(writeContracts.SoRadDEX.withdraw(withdrawValue), update => {
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
  const liquidityEditGradient = isLightTheme ? nestedCardBGLight : nestedCardBGDark;
  return (
    <div
      style={{
        width: `${totalWidthRem}rem`,
        margin: "1.5rem auto 0",
      }}
    >
      <Card style={{ background: liquidityEditGradient }}>
        {readyAll && (
          <>
            <div style={{ marginBottom: "0.25rem" }}>{userBalances}</div>

            <div style={{ display: "flex", gap: "2rem", flexDirection: "column", paddingBottom: "0.5rem" }}>
              {liquidityForm("deposit")}
              {liquidityForm("withdraw")}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default LiquidityEdit;
