import { Button, Col, Menu, Row, Spin } from "antd";
import "antd/dist/antd.css";

import { useBalance, useContractLoader, useGasPrice, useOnBlock, useUserProviderAndSigner } from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";

import React, { useCallback, useEffect, useState, createContext, useMemo } from "react";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import { useStaticJsonRPC } from "./hooks";
import { Web3ModalSetup } from "./helpers";
import "./App.css";
import {
  Account,
  Contract,
  Dex,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  FaucetHint,
  NetworkSwitch,
} from "./components";
import { Transactor } from "./helpers";
import CustomNetworkDisplay from "./components/CustomKit/CustomNetworkDisplay";
import { NETWORKS, ALCHEMY_KEY } from "./constants";

// contracts
import externalContracts from "./contracts/external_contracts";
import deployedContracts from "./contracts/hardhat_contracts.json";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const defaultTargetNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

export const AppContext = createContext({});
export const ThemeContext = createContext({
  theme: "",
  setTheme: () => {},
});

const App = props => {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = ["localhost", "mainnet", "rinkeby"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const selectedNetworkOption = networkOptions.includes(defaultTargetNetwork.name)
    ? defaultTargetNetwork.name
    : networkOptions[0];
  const [selectedNetwork, setSelectedNetwork] = useState(selectedNetworkOption);

  /// 📡 What chain are your contracts deployed to?
  const targetNetwork = NETWORKS[selectedNetwork]; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  let yourLocalBalance;
  try {
    // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
    yourLocalBalance = useBalance(localProvider, address);
  } catch (e) {
    // just in order to keep the react app from crashing
    console.log(e);
  }

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  // const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  // const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
  //   "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  // ]);

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts
      // mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      // console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      // console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    // mainnetContracts,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const readyAll = readContracts && readContracts.SoRadDEX && address && localProvider && yourLocalBalance;

  const appContext = {
    contractConfig,
    readContracts,
    writeContracts,
    userSigner,
    localProvider,
    userAddress: address,
    tx,
    userEthBalance: yourLocalBalance,
    price,
    gasPrice,
  };

  const [theme, setTheme] = useState(window.localStorage.getItem("theme"));
  const themeContext = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <ThemeContext.Provider value={themeContext}>
      <AppContext.Provider value={appContext}>
        <div className="App">
          {/* ✏️ Edit the header and change the title to your project name */}
          <Header />
          <CustomNetworkDisplay
            NETWORKCHECK={NETWORKCHECK}
            localChainId={localChainId}
            selectedChainId={selectedChainId}
            targetNetwork={targetNetwork}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
          />
          <BrowserRouter>
            <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
              <Menu.Item key="/">
                <Link
                  onClick={() => {
                    setRoute("/");
                  }}
                  to="/"
                >
                  So Rad DEX
                </Link>
              </Menu.Item>
              <Menu.Item key="/contracts">
                <Link
                  onClick={() => {
                    setRoute("/contracts");
                  }}
                  to="/contracts"
                >
                  Debug Contracts
                </Link>
              </Menu.Item>
            </Menu>

            <div className="AppScroller">
              <Switch>
                <Route exact path="/">
                  {!readyAll && (
                    <div
                      style={{
                        height: "40vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                      }}
                    >
                      <Spin size="large" />
                    </div>
                  )}
                  {readyAll && (
                    <div style={{ marginTop: "4rem" }}>
                      <Dex />
                    </div>
                  )}
                </Route>
                <Route path="/contracts">
                  <Contract
                    name="SoRadDEX"
                    signer={userSigner}
                    provider={localProvider}
                    address={address}
                    blockExplorer={blockExplorer}
                    contractConfig={contractConfig}
                  />
                  <Contract
                    name="SoRadToken"
                    signer={userSigner}
                    provider={localProvider}
                    address={address}
                    blockExplorer={blockExplorer}
                    contractConfig={contractConfig}
                  />
                </Route>
              </Switch>
            </div>
          </BrowserRouter>

          <ThemeSwitch />

          {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
          <div
            style={{
              position: "fixed",
              textAlign: "right",
              right: 0,
              top: 0,
              padding: 10,
            }}
            className="hud hudTop"
          >
            <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
              <Account
                address={address}
                localProvider={localProvider}
                userSigner={userSigner}
                mainnetProvider={mainnetProvider}
                price={price}
                web3Modal={web3Modal}
                loadWeb3Modal={loadWeb3Modal}
                logoutOfWeb3Modal={logoutOfWeb3Modal}
                blockExplorer={blockExplorer}
              />
            </div>
            <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
          </div>

          {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
          <div
            style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}
            className="hud hudBottom"
          >
            <Row align="middle" gutter={[4, 4]}>
              <Col span={8}>
                <Ramp price={price} address={address} networks={NETWORKS} />
              </Col>

              <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
                <GasGauge gasPrice={gasPrice} />
              </Col>
              <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
                <Button
                  onClick={() => {
                    window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
                  }}
                  size="large"
                  shape="round"
                >
                  <span style={{ marginRight: 8 }} role="img" aria-label="support">
                    💬
                  </span>
                  Support
                </Button>
              </Col>
            </Row>

            <Row align="middle" gutter={[4, 4]}>
              <Col span={24}>
                {
                  /*  if the local provider has a signer, let's show the faucet:  */
                  faucetAvailable ? (
                    <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
                  ) : (
                    ""
                  )
                }
              </Col>
            </Row>
          </div>
        </div>
      </AppContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
