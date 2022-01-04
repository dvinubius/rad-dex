import { Input } from "antd";
import React, { useEffect, useState } from "react";

/*
  Based on EtherInput from scaffold-eth buidl kit
  Changed so that it can be initialized with etherMode via props
*/

export default function CustomEtherInput(props) {
  const [mode, setMode] = useState(props.etherMode ? "ETH" : props.price ? "USD" : "ETH");
  const [display, setDisplay] = useState();
  const [value, setValue] = useState();

  const currentValue = typeof props.value !== "undefined" ? props.value : value;

  useEffect(() => {
    if (!currentValue) {
      setDisplay("");
    }
  }, [currentValue]);

  return (
    <Input
      placeholder={props.placeholder ? props.placeholder : "amount in " + mode}
      autoFocus={props.autoFocus}
      prefix={mode === "USD" ? "$" : "Ξ"}
      value={display}
      addonAfter={
        !props.price ? (
          ""
        ) : (
          <div
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (mode === "USD") {
                setMode("ETH");
                setDisplay(currentValue);
              } else {
                setMode("USD");
                if (currentValue) {
                  const usdValue = "" + (parseFloat(currentValue) * props.price).toFixed(2);
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
            const ethValue = possibleNewValue / props.price;
            setValue(ethValue);
            if (typeof props.onChange === "function") {
              props.onChange(ethValue, mode);
            }
            setDisplay(newValue);
          } else {
            setDisplay(newValue);
          }
        } else {
          setValue(newValue);
          if (typeof props.onChange === "function") {
            props.onChange(newValue, mode);
          }
          setDisplay(newValue);
        }
      }}
    />
  );
}
