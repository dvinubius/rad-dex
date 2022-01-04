import { useEffect, useState } from "react";
import { Input, Row, Col, Divider } from "antd";
import { softTextCol } from "../../styles";
const { ethers } = require("ethers");

const contractName = "SoRadDEX";
const tokenName = "SoRadToken";

const LiquidityEdit = ({
  userAddress,
  readContracts,
  writeContracts,
  localProvider,
  tx,
  dexEthReserve,
  dexTokenReserve,
}) => {
  const [values, setValues] = useState({});
  const [isDepositAmountApproved, setIsDepositAmountApproved] = useState();
  // useEffect(() => {
  //   if (!values) {
  //     setIsSellAmountApproved(false);
  //     return;
  //   }

  //   console.log("tokenFormAmount", tokenFormAmount);
  //   const tokenFormAmountBN = tokenFormAmount && ethers.utils.parseEther("" + tokenFormAmount);
  //   console.log("tokenFormAmountBN", tokenFormAmountBN);
  //   setIsSellAmountApproved(dexApproval && tokenFormAmount && dexApproval.gte(tokenFormAmountBN));
  // }, [tokenFormAmount, readContracts, dexApproval]);
  // console.log("isSellAmountApproved", isSellAmountApproved);

  const rowForm = (title, icon, onClick) => {
    return (
      <Row>
        <Col span={16}>
          <div style={{ cursor: "pointer", margin: 2 }}>
            <Input
              onChange={e => {
                let newValues = { ...values };
                newValues[title] = e.target.value;
                setValues(newValues);
              }}
              value={values[title]}
              addonAfter={
                <div
                  type="default"
                  onClick={() => {
                    onClick(values[title]);
                    let newValues = { ...values };
                    newValues[title] = "";
                    setValues(newValues);
                  }}
                >
                  {icon}
                </div>
              }
            />
          </div>
        </Col>
      </Row>
    );
  };

  const depositForm = rowForm("deposit", "Deposit", async value => {
    let valueInEther = ethers.utils.parseEther("" + value);
    let valuePlusExtra = ethers.utils.parseEther("" + value * 1.03);
    console.log("valuePlusExtra", valuePlusExtra);
    debugger;
    let allowance = await readContracts[tokenName].allowance(userAddress, readContracts[contractName].address);
    console.log("allowance", allowance);
    debugger;
    let nonce = await localProvider.getTransactionCount(userAddress);
    console.log("nonce", nonce);
    let approveTx;
    if (allowance.lt(valuePlusExtra)) {
      debugger;
      approveTx = tx(
        writeContracts[tokenName].approve(readContracts[contractName].address, valuePlusExtra, {
          gasLimit: 200000,
          nonce: nonce++,
        }),
      );
      console.log("approve tx is in, not waiting on it though...", approveTx);
    }
    let depositTx = writeContracts[contractName]["deposit"]({
      from: userAddress,
      value: valueInEther,
      gasLimit: 200000,
      nonce: nonce++,
    });
    if (approveTx) {
      console.log("waiting on approve to finish...");
      let approveTxResult = await approveTx;
      console.log("approveTxResult:", approveTxResult);
    }
    let depositTxResult = await depositTx;
    console.log("depositTxResult:", depositTxResult);
  });

  const withdrawForm = rowForm("withdraw", "Withdraw", async value => {
    let valueInEther = ethers.utils.parseEther("" + value);
    let withdrawTxResult = writeContracts[contractName]["withdraw"](valueInEther, { from: userAddress });
    console.log("withdrawTxResult:", withdrawTxResult);
  });

  return (
    <div style={{ width: "22rem", margin: "2rem auto 0" }}>
      {depositForm}
      {withdrawForm}
    </div>
  );
};

export default LiquidityEdit;
