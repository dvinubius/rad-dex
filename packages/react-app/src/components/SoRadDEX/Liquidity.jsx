import { Button, Tabs, Row, Col, Descriptions, Divider, Input } from "antd";
import React, { useState } from "react";
import { primaryCol, softTextCol } from "../../styles";
import CustomBalance from "../CustomKit/CustomBalance";
import LiquidityEdit from "./LiquidityEdit";
import "./Liquidity.css";
import { DownOutlined, MinusCircleOutlined, MinusOutlined, PlusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const Liquidity = ({
  tokenBalance,
  ethBalance,
  totalLiquidity,
  userLiquidity,
  readContracts,
  localProvider,
  writeContracts,
  userAddress,
  tx,
}) => {
  const valuesColor = "deeppink";
  const mineColor = primaryCol;

  const labelCol = "hsl(0, 0%, 40%)";
  const totalCol = valuesColor;

  const labelStyle = { fontSize: "1rem", color: labelCol, flexShrink: 0 };
  const balanceWrapperStyle = { width: "100%", display: "flex", justifyContent: "flex-end" };

  const canCalculate = userLiquidity && totalLiquidity;
  const userTokenReserve = canCalculate && userLiquidity.mul(tokenBalance).div(totalLiquidity);
  const userEthReserve = canCalculate && userLiquidity.mul(ethBalance).div(totalLiquidity);

  const [depositsHeight, setDepositsHeight] = useState(0);
  const toggleDepositsVisibility = () => {
    const maxHeight = 200;
    setDepositsHeight(Math.abs(depositsHeight - maxHeight));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: "2rem" }}>
        <div
          style={{
            width: "12rem",
          }}
          className="Liquidity"
        >
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 1rem 0.5rem" }}>
            <div style={{ ...labelStyle, color: "#111111", fontWeight: 500 }}>Total</div>

            <div style={balanceWrapperStyle}>
              <CustomBalance
                balance={totalLiquidity}
                etherMode
                size="1rem"
                padding={0}
                noClick
                customColor={totalCol}
              />
            </div>
          </div>
          <Descriptions bordered size="small" style={{ backgroundColor: "white", width: "100%" }}>
            {[0, 1].map(idx => (
              <Descriptions.Item label={<span style={labelStyle}>{idx === 0 ? "SRT" : "ETH"}</span>} span={6}>
                <div style={{ ...balanceWrapperStyle, opacity: 0.8 }}>
                  <CustomBalance
                    balance={idx === 0 ? tokenBalance : ethBalance}
                    etherMode
                    customSymbol=""
                    size="1rem"
                    padding={0}
                    noClick
                    customColor={valuesColor}
                  />
                </div>
              </Descriptions.Item>
            ))}
          </Descriptions>
        </div>
        <div
          style={{
            width: "12rem",
            display: "flex",
            flexDirection: "column",
          }}
          className="Liquidity"
        >
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 1rem 0.5rem" }}>
            <div style={{ ...labelStyle, color: "#111111", fontWeight: 500 }}>Yours</div>

            <div style={balanceWrapperStyle}>
              <CustomBalance
                balance={userLiquidity}
                etherMode
                size="1rem"
                padding={0}
                noClick
                customColor={mineColor}
              />
            </div>
          </div>
          <Descriptions bordered size="small" style={{ backgroundColor: "white", width: "100%" }}>
            {[0, 1].map(idx => (
              <Descriptions.Item label={<span style={labelStyle}>{idx === 0 ? "SRT" : "ETH"}</span>} span={6}>
                <div style={{ ...balanceWrapperStyle, opacity: 0.8 }}>
                  <CustomBalance
                    balance={idx === 0 ? userTokenReserve : userEthReserve}
                    etherMode
                    customSymbol=""
                    size="1rem"
                    padding={0}
                    noClick
                    customColor={primaryCol}
                  />
                </div>
              </Descriptions.Item>
            ))}
          </Descriptions>
          <div
            style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1rem" }}
          >
            <Button
              size="large"
              type="default"
              style={{
                // width: "12rem",
                width: "7rem",
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                // fontSize: "1.25rem",
                color: softTextCol,
              }}
              onClick={toggleDepositsVisibility}
            >
              {/* <div style={{ marginRight: "1rem" }}>📥</div> */}
              Manage
              {/* <PlusCircleOutlined /> <div style={{ transform: "translateY(-0.1rem)" }}>/</div> <MinusCircleOutlined /> */}
              <div
                style={{
                  fontSize: "1rem",
                  transition: "all 0.3s ease-out",
                  transform: depositsHeight === 0 ? "translateY(0.05rem)" : "rotateX(180deg) translateY(0.05rem)",
                }}
              >
                <DownOutlined />
              </div>
              {/* <div style={{ marginLeft: "1rem" }}>📤</div> */}
            </Button>
          </div>
        </div>
      </div>

      <div style={{ maxHeight: depositsHeight, overflow: "hidden", transition: "all 0.3s ease-out" }}>
        <LiquidityEdit
          userAddress={userAddress}
          localProvider={localProvider}
          readContracts={readContracts}
          writeContracts={writeContracts}
          dexEthReserve={ethBalance}
          dexTokenReserve={tokenBalance}
          tx={tx}
        />
      </div>
    </div>
  );
};
export default Liquidity;
