import { Input } from "antd";
import React from "react";
import { softTextColor } from "../../styles";
import CustomBalance from "../CustomKit/CustomBalance";

const SwapInput = ({ prefix, disabled, inputValue, maxInput, onChange, onApplyMax }) => {
  return (
    <Input
      size="large"
      disabled={disabled}
      style={{ textAlign: "left" }}
      prefix={<span style={{ marginRight: "0.5rem" }}>{prefix}</span>}
      suffix={
        <span
          style={{
            color: softTextColor,
            marginRight: "0.5rem",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "opacity 0.1s ease-out",
          }}
          onClick={disabled ? null : onApplyMax}
        >
          max <CustomBalance noClick etherMode={false} customSymbol="" size={16} padding={0} balance={maxInput} />
        </span>
      }
      value={inputValue}
      onChange={onChange}
      onPaste={e => e.preventDefault()}
    />
  );
};
export default SwapInput;
