import { CameraOutlined, QrcodeOutlined } from "@ant-design/icons";
import { Badge, Input } from "antd";
import { useLookupAddress } from "eth-hooks/dapps/ens";
import React, { useCallback, useState } from "react";
import QrReader from "react-qr-reader";
import Blockie from "../Blockie";
import { ethers } from "ethers";

// probably we need to change value={toAddress} to address={toAddress}

/*
 * cusom size prop
 */

const isENS = (address = "") => address.endsWith(".eth") || address.endsWith(".xyz");

export default function CustomAddressInput({
  value,
  wrapperStyle,
  autoFocus,
  placeholder,
  ensProvider,
  size,
  onChange,
}) {
  const [valueToUse, setValue] = useState(value);
  const [scan, setScan] = useState(false);

  const currentValue = typeof value !== "undefined" ? value : valueToUse;
  const ens = useLookupAddress(ensProvider, currentValue);

  const updateAddress = useCallback(
    async newValue => {
      if (typeof newValue !== "undefined") {
        let address = newValue;
        if (isENS(address)) {
          try {
            const possibleAddress = await ensProvider.resolveName(address);
            if (possibleAddress) {
              address = possibleAddress;
            }
            // eslint-disable-next-line no-empty
          } catch (e) {}
        }
        setValue(address);
        if (typeof onChange === "function") {
          onChange(address);
        }
      }
    },
    [ensProvider, onChange],
  );

  return (
    <div style={wrapperStyle}>
      {scan ? (
        <div
          style={{
            zIndex: 256,
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
          }}
          onClick={() => {
            setScan(false);
          }}
        >
          <QrReader
            delay={250}
            resolution={1200}
            onError={e => {
              console.log("SCAN ERROR", e);
              setScan(false);
            }}
            onScan={newValue => {
              if (newValue) {
                console.log("SCAN VALUE", newValue);
                let possibleNewValue = newValue;
                if (possibleNewValue.indexOf("/") >= 0) {
                  possibleNewValue = possibleNewValue.substr(possibleNewValue.lastIndexOf("0x"));
                  console.log("CLEANED VALUE", possibleNewValue);
                }
                setScan(false);
                updateAddress(possibleNewValue);
              }
            }}
            style={{ width: "100%" }}
          />
        </div>
      ) : (
        ""
      )}
      <Input
        id="0xAddress" // name it something other than address for auto fill doxxing
        name="0xAddress" // name it something other than address for auto fill doxxing
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder ? placeholder : "address"}
        prefix={<Blockie address={currentValue} size={8} scale={3} />}
        value={ethers.utils.isAddress(currentValue) && !isENS(currentValue) && isENS(ens) ? ens : currentValue}
        size={size === "large" ? "large" : "medium"}
        addonAfter={
          <div
            style={{ marginTop: 4, cursor: "pointer", width: "3.5rem" }}
            onClick={() => {
              setScan(!scan);
            }}
          >
            <Badge count={<CameraOutlined style={{ fontSize: 9 }} />}>
              <QrcodeOutlined style={{ fontSize: 18 }} />
            </Badge>{" "}
            Scan
          </div>
        }
        onChange={e => {
          updateAddress(e.target.value);
        }}
      />
    </div>
  );
}
