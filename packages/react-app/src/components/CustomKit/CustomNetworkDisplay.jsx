import { Alert, Button } from "antd";
import React from "react";
import { NETWORK } from "../../constants";
import { mediumBorder, mediumBorder2, mediumBorder3, softBorder2, softBorder2Col } from "../../styles";

/**
 * Based on NetworkDisplay from scaffold-eth buidl kit
 * Changed so that current network is displayed at a different position
 */
function CustomNetworkDisplay({ NETWORKCHECK, localChainId, selectedChainId, targetNetwork, logoutOfWeb3Modal }) {
  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 55, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      const showLogout = networkSelected && networkSelected.name !== "localhost";
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 55, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);

                    let switchTx;
                    // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                    try {
                      switchTx = await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: data[0].chainId }],
                      });
                    } catch (switchError) {
                      // not checking specific error code, because maybe we're not using MetaMask
                      try {
                        switchTx = await ethereum.request({
                          method: "wallet_addEthereumChain",
                          params: data,
                        });
                      } catch (addError) {
                        // handle "add" error
                      }
                    }

                    if (switchTx) {
                      console.log(switchTx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div
        style={{
          fontSize: "0.875rem",
          padding: "0.125rem 1rem 0.125rem 0.75rem",
          backgroundColor: "hsla(0,0%,100%, 0.9)",
          height: "30px",
          display: "flex",
          alignItems: "center",
          color: "rgb(24, 144, 255)",
          borderTop: mediumBorder3,
          borderLeft: mediumBorder3,
          borderBottom: mediumBorder3,
        }}
      >
        {targetNetwork.name}
      </div>
    );
  }

  return networkDisplay;
}

export default CustomNetworkDisplay;
