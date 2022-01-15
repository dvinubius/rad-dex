import { Input } from "antd";
import React, { useEffect, useState } from "react";

/*
  Based on EtherInput from scaffold-eth buidl kit
  Changed so that it can be initialized with etherMode via props
*/

export default function CustomEtherInput({ etherMode, price, value, wrapperStyle, placeholder, autoFocus, onChange }) {
  const [mode, setMode] = useState(etherMode ? "ETH" : price ? "USD" : "ETH");
  const [display, setDisplay] = useState();
  const [valueToUse, setValue] = useState();

  const currentValue = typeof value !== "undefined" ? value : valueToUse;

  useEffect(() => {
    if (!currentValue) {
      setDisplay("");
    }
  }, [currentValue]);

  return (
    <Input
      style={{ ...wrapperStyle }}
      placeholder={placeholder ? placeholder : "amount in " + mode}
      autoFocus={autoFocus}
      prefix={mode === "USD" ? "$" : "Ξ"}
      value={display}
      addonAfter={
        !price ? (
          ""
        ) : (
          <div
            style={{ cursor: "pointer", width: "3.5rem" }}
            onClick={() => {
              if (mode === "USD") {
                setMode("ETH");
                setDisplay(currentValue);
              } else {
                setMode("USD");
                if (currentValue) {
                  const usdValue = "" + (parseFloat(currentValue) * price).toFixed(2);
                  setDisplay(usdValue);
                } else {
                  setDisplay(currentValue);
                }
              }
            }}
          >
            {mode === "USD" ? "USD 🔀" : "ETH 🔀"}
          </div>
        )
      }
      onChange={async e => {
        const newValue = e.target.value;
        if (mode === "USD") {
          const possibleNewValue = parseFloat(newValue);
          if (possibleNewValue) {
            const ethValue = possibleNewValue / price;
            setValue(ethValue);
            if (typeof onChange === "function") {
              onChange(ethValue, mode);
            }
            setDisplay(newValue);
          } else {
            setDisplay(newValue);
          }
        } else {
          setValue(newValue);
          if (typeof onChange === "function") {
            onChange(newValue, mode);
          }
          setDisplay(newValue);
        }
      }}
    />
  );
}
