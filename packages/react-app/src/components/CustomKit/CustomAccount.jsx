import { UserOutlined } from "@ant-design/icons";
import { Button, Popover } from "antd";
import React, { useContext } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { AppContext, LayoutContext } from "../../App";
import { breakPointAccountDisplayMinimize } from "../../styles";
import CustomAddress from "./CustomAddress";
import CustomBalance from "./CustomBalance";
import CustomWallet from "./CustomWallet";

/*
 */

export default function CustomAccount({
  address,
  userSigner,
  localProvider,
  mainnetProvider,
  price,
  minimized,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer,
  connectedNetworkDisplay,
}) {
  const { windowWidth } = useContext(LayoutContext);
  const { userEthBalance } = useContext(AppContext);
  const isSmallScreen = windowWidth < breakPointAccountDisplayMinimize;

  const modalButtons = [];
  if (web3Modal) {
    if (web3Modal.cachedProvider) {
      modalButtons.push(
        <Button
          key="logoutbutton"
          // style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
          shape="round"
          // size="large"
          onClick={logoutOfWeb3Modal}
        >
          logout
        </Button>,
      );
    } else {
      modalButtons.push(
        <Button
          key="loginbutton"
          // style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
          shape="round"
          // size="large"
          /* type={minimized ? "default" : "primary"}     too many people just defaulting to MM and having a bad time */
          onClick={loadWeb3Modal}
        >
          connect
        </Button>,
      );
    }
  }

  const { currentTheme } = useThemeSwitcher();

  const addr = address ? (
    <CustomAddress address={address} fontSize={18} ensProvider={mainnetProvider} blockExplorer={blockExplorer} />
  ) : (
    "Connecting..."
  );

  const bal = (
    <CustomBalance
      balance={userEthBalance}
      address={address}
      size="1.125rem"
      provider={localProvider}
      price={price}
      padding=".25rem 0 .25rem .5rem"
    />
  );
  const wallet = (
    <CustomWallet
      fontSize="1.5rem"
      minimized
      address={address}
      provider={localProvider}
      signer={userSigner}
      ensProvider={mainnetProvider}
      price={price}
      color={currentTheme === "light" ? "#1890ff" : "#2caad9"}
    />
  );

  const currentNetwork = connectedNetworkDisplay && (
    <div style={{ marginRight: "-0.5rem" }}>{connectedNetworkDisplay}</div>
  );

  const fullDisplay = (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      {addr}
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        {bal}
        {wallet}
      </div>
    </div>
  );

  const display = minimized ? (
    ""
  ) : isSmallScreen ? (
    <Popover content={fullDisplay} trigger="click">
      <Button>
        <UserOutlined />
      </Button>
    </Popover>
  ) : (
    fullDisplay
  );

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {display}
      <div style={{ display: "flex", alignItems: "center", marginLeft: "0.5rem" }}>
        {currentNetwork}
        {modalButtons}
      </div>
    </div>
  );
}
