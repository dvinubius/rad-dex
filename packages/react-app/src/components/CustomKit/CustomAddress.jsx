import { Skeleton, Typography } from "antd";
import React from "react";
import Blockies from "react-blockies";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { useLookupAddress } from "eth-hooks/dapps/ens";
import "./CustomAddress.css";

// changed value={address} to address={address}

/*
  Used Address from scaffold-eth buidl kit
  chaged so that blockie is optional
*/

const { Text } = Typography;

const blockExplorerLink = (address, blockExplorer) =>
  `${blockExplorer || "https://etherscan.io/"}${"address/"}${address}`;

export default function CustomAddress({
  value,
  onChange,
  noBlockie,
  fontSize,
  address,
  ensProvider,
  blockExplorer,
  size,
}) {
  const { currentTheme } = useThemeSwitcher();
  const addr = value || address;
  const ens = useLookupAddress(ensProvider, addr);
  const ensSplit = ens && ens.split(".");
  const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";
  const etherscanLink = blockExplorerLink(addr, blockExplorer);
  let displayAddress = addr?.substr(0, 5) + "..." + addr?.substr(-4);

  if (validEnsCheck) {
    displayAddress = ens;
  } else if (size === "short") {
    displayAddress += "..." + addr.substr(-4);
  } else if (size === "long") {
    displayAddress = addr;
  }

  if (!addr) {
    return (
      <span>
        <Skeleton avatar paragraph={{ rows: 1 }} />
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", width: "max-content" }} className={`CustomAddress`}>
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {!noBlockie && <Blockies seed={addr.toLowerCase()} size={8} scale={fontSize ? fontSize / 7 : 4} />}
      </span>
      <span style={{ paddingLeft: 5, fontSize: fontSize ? fontSize : 28 }}>
        {onChange ? (
          <Text editable={{ onChange: onChange }} copyable={{ text: addr }}>
            <a
              style={{ color: currentTheme === "light" ? "#222222" : "#ddd" }}
              target="_blank"
              href={etherscanLink}
              rel="noopener noreferrer"
            >
              {displayAddress}
            </a>
          </Text>
        ) : (
          <Text copyable={{ text: addr }}>
            <a
              style={{ color: currentTheme === "light" ? "#222222" : "#ddd" }}
              target="_blank"
              href={etherscanLink}
              rel="noopener noreferrer"
            >
              {displayAddress}
            </a>
          </Text>
        )}
      </span>
    </span>
  );
}
