import { SwapOutlined } from "@ant-design/icons";
import { PageHeader } from "antd";
import React from "react";
import { mediumBorder3, softTextColor } from "../../styles";
import "./CustomHeader.css";

// displays a page header

export default function CustomHeader() {
  return (
    <PageHeader
      className="CustomHeader"
      title={
        <SwapOutlined
          style={{
            fontSize: "2rem",
            transform: "translateY(0.125rem)",
            // background: "linear-gradient(90deg,  transparent, hsla(328,50%,50%,0.09), transparent)",
            padding: "0.1 25rem",
            color: softTextColor,
          }}
        />
      }
      subTitle={<div style={{ fontSize: "1.25rem" }}>Minimum Viable DEX</div>}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", height: "54px", padding: "1rem" }}
    />
  );
}
