import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Col, Input, Divider } from "antd";
import Curve from "./Curve";
import { useBalance, useContractReader } from "eth-hooks";
import SoRadDEX from "./SoRadDEX/SoRadDEX";

const contractName = "SoRadDEX";
const tokenName = "SoRadToken";

export default function DEX({
  userAddress,
  dexAddress,
  readContracts,
  tx,
  localProvider,
  writeContracts,
  contractConfig,
  userEthBalance,
  userSigner,
  price,
  gasPrice,
}) {
  const userTokenBalance = useContractReader(readContracts, "SoRadToken", "balanceOf", [userAddress]);
  const dexTokenBalance = useContractReader(readContracts, tokenName, "balanceOf", [dexAddress]);
  const dexTokenBalanceFloat = dexTokenBalance && parseFloat(ethers.utils.formatEther(dexTokenBalance).toString());
  const dexEthBalance = useBalance(localProvider, dexAddress);
  const dexEthBalanceFloat = parseFloat(ethers.utils.formatEther(dexEthBalance));

  const [tokensPerEth, setTokensPerEth] = useState();
  useEffect(() => {
    const oneEth = ethers.utils.parseEther("1");
    const update = async () => {
      const tpeRaw = await readContracts.SoRadDEX.price(oneEth, dexEthBalance, dexTokenBalance);
      setTokensPerEth(tpeRaw);
    };
    if (readContracts && readContracts.SoRadDEX && dexEthBalance && dexTokenBalance) {
      update();
    }
  }, [readContracts, dexEthBalance, dexTokenBalance]);

  const totalLiquidity = useContractReader(readContracts, contractName, "totalLiquidity");
  const userLiquidity = useContractReader(readContracts, contractName, "liquidity", [userAddress]);

  const [addingEth, setAddingEth] = useState();
  const [addingToken, setAddingToken] = useState();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2rem" }}>
      <SoRadDEX
        localProvider={localProvider}
        contractConfig={contractConfig}
        readContracts={readContracts}
        writeContracts={writeContracts}
        dexAddress={dexAddress}
        userSigner={userSigner}
        userTokenBalance={userTokenBalance}
        userAddress={userAddress}
        price={price}
        gasPrice={gasPrice}
        tx={tx}
        userEthBalance={userEthBalance}
        tokensPerEth={tokensPerEth}
        totalLiquidity={totalLiquidity}
        userLiquidity={userLiquidity}
        height={490}
        updateEthInput={setAddingEth}
        updateTokenInput={setAddingToken}
      />
      <div style={{ padding: "0 2rem" }}>
        <Curve
          addingEth={addingEth}
          addingToken={addingToken}
          ethReserve={dexEthBalanceFloat}
          tokenReserve={dexTokenBalanceFloat}
          width={400}
          height={400}
        />
      </div>
    </div>
  );
}
