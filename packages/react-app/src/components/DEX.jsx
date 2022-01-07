import React, { useState, useEffect, useContext, useMemo } from "react";
import { ethers } from "ethers";
import Curve from "./Curve";
import { useBalance, useContractLoader, useContractReader } from "eth-hooks";
import SoRadDEX from "./SoRadDEX/SoRadDEX";
import { AppContext } from "../App";
import { createContext } from "react";

const contractName = "SoRadDEX";
const tokenName = "SoRadToken";

export const DexContext = createContext({});

export default function DEX() {
  const { readContracts, localProvider, userAddress, contractConfig } = useContext(AppContext);

  const tokenAddress = readContracts.SoRadToken.address;

  const dexAddress = readContracts && readContracts.SoRadDEX && readContracts.SoRadDEX.address;
  const dexTokenBalance = useContractReader(readContracts, tokenName, "balanceOf", [dexAddress]);
  const dexTokenBalanceFloat = dexTokenBalance && parseFloat(ethers.utils.formatEther(dexTokenBalance).toString());
  const dexEthBalance = useBalance(localProvider, dexAddress);
  const dexEthBalanceFloat = parseFloat(ethers.utils.formatEther(dexEthBalance));

  const dexApproval = useContractReader(readContracts, "SoRadToken", "allowance", [userAddress, dexAddress]);
  const userTokenBalance = useContractReader(readContracts, "SoRadToken", "balanceOf", [userAddress]);

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

  const dexLiquidity = useContractReader(readContracts, contractName, "totalLiquidity");
  const userLiquidity = useContractReader(readContracts, contractName, "liquidity", [userAddress]);

  const [ethInputForCurve, setEthInputForCurve] = useState();
  const [tokenInputForCurve, setTokenInputForCurve] = useState();

  const contracts = useContractLoader(localProvider, contractConfig);

  const dexContract = useMemo(() => {
    const { SoRadDEX } = contracts;
    return SoRadDEX && new ethers.Contract(SoRadDEX.address, SoRadDEX.interface, localProvider);
  }, [contractConfig, localProvider, contracts]);

  const dexContext = {
    tokenAddress,
    dexAddress,
    dexTokenBalance,
    dexEthBalance,
    dexLiquidity,
    userLiquidity,
    tokensPerEth,
    dexApproval,
    userTokenBalance,
    dexContract,
    setEthInputForCurve,
    setTokenInputForCurve,
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", gap: "2rem" }}>
      <DexContext.Provider value={dexContext}>
        <SoRadDEX height={490} />
      </DexContext.Provider>
      <div style={{ alignSelf: "flex-start" }}>
        <Curve
          addingEth={ethInputForCurve}
          addingToken={tokenInputForCurve}
          ethReserve={dexEthBalanceFloat}
          tokenReserve={dexTokenBalanceFloat}
          width={480}
          height={480}
        />
      </div>
    </div>
  );
}
