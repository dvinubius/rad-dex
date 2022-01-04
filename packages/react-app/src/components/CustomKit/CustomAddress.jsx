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

const blockExplorerLink = (address, blockExplorer) => blockExplorer || `https://etherscan.io/address/${address}`;

export default function CustomAddress(props) {
  const { currentTheme } = useThemeSwitcher();
  const address = props.value || props.address;
  const ens = useLookupAddress(props.ensProvider, address);
  const ensSplit = ens && ens.split(".");
  const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";
  const etherscanLink = blockExplorerLink(address, props.blockExplorer);
  let displayAddress = address?.substr(0, 5) + "..." + address?.substr(-4);

  if (validEnsCheck) {
    displayAddress = ens;
  } else if (props.size === "short") {
    displayAddress += "..." + address.substr(-4);
  } else if (props.size === "long") {
    displayAddress = address;
  }

  if (!address) {
    return (
      <span>
        <Skeleton avatar paragraph={{ rows: 1 }} />
      </span>
    );
  }

  if (props.minimized) {
    return (
      <span style={{ verticalAlign: "middle" }}>
        <a
          style={{ color: currentTheme === "light" ? "#222222" : "#ddd" }}
          target="_blank"
          href={etherscanLink}
          rel="noopener noreferrer"
        >
          <Blockies seed={address.toLowerCase()} size={8} scale={2} />
        </a>
      </span>
    );
  }

  const catchEvent = e => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }} onClick={catchEvent} className="CustomAddress">
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {!props.noBlockie && (
          <Blockies seed={address.toLowerCase()} size={8} scale={props.fontSize ? props.fontSize / 7 : 4} />
        )}
      </span>
      <span style={{ paddingLeft: 5, fontSize: props.fontSize ? props.fontSize : 28 }}>
        {props.onChange ? (
          <Text editable={{ onChange: props.onChange }} copyable={{ text: address }}>
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
          <Text copyable={{ text: address }}>
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
