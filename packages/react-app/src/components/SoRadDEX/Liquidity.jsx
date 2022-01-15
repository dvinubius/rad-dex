import { Button, Tabs, Row, Col, Descriptions, Divider, Input, Tooltip } from "antd";
import React, { useContext, useState } from "react";
import { primaryColor, softBg, softTextColor, nestedCardBGDark, nestedCardBGLight } from "../../styles";
import CustomBalance from "../CustomKit/CustomBalance";
import LiquidityEdit from "./LiquidityEdit";
import "./Liquidity.css";
import { DownOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { DexContext } from "../DEX";
import { ThemeContext } from "../../App";

const Liquidity = ({ dexContext }) => {
  const { dexTokenBalance, dexEthBalance, dexLiquidity, userLiquidity } = useContext(DexContext);
  const { theme } = useContext(ThemeContext);

  const isLightTheme = theme === "light";

  const valuesColor = "deeppink";
  const mineColor = primaryColor;

  const labelCol = "hsl(0, 0%, 40%)";
  const totalCol = valuesColor;

  const labelStyle = {
    fontSize: "1rem",
    color: labelCol,
    flexShrink: 0,
    color: window.localStorage.getItem("theme") === "light" ? "#111111" : "#eeeeee",
  };
  const balanceWrapperStyle = {
    width: "100%",
    display: "flex",
    justifyContent: "flex-end",
  };

  const canCalculate = userLiquidity && dexLiquidity;
  const userTokenReserve = canCalculate && userLiquidity.mul(dexTokenBalance).div(dexLiquidity);
  const userEthReserve = canCalculate && userLiquidity.mul(dexEthBalance).div(dexLiquidity);

  const [depositsHeight, setDepositsHeight] = useState(0);
  const toggleDepositsVisibility = () => {
    const maxHeight = 240;
    setDepositsHeight(Math.abs(depositsHeight - maxHeight));
  };

  const liquidityWidthRem = 30;

  const help = (
    <div style={{ paddingTop: "0.5rem" }}>
      <p>
        Your <strong>Liquidity</strong> changes only when you deposit or withdraw. It is not affected by swaps.
      </p>
      <p>
        Your ETH and SRT <strong>reserves</strong> make up your liquidity. The reserves ratio is affected by swaps.
      </p>
      <p>Your ETH/SRT ratio is the same as the total ETH/SRT ratio of the pool.</p>
    </div>
  );
  const ownLiquidityHelp = (
    <div
      style={{
        marginTop: "0.125rem",
      }}
    >
      <Tooltip
        title={help}
        overlayInnerStyle={{
          width: "22rem",
          backgroundColor: isLightTheme ? "white" : "black",
          color: isLightTheme ? "#111" : "#eee",
          opacity: 0.9,
        }}
      >
        <QuestionCircleOutlined style={{ fontSize: "0.875rem", flexGrow: 1, color: softTextColor }} />
      </Tooltip>
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "auto",
          gap: "2rem",
          width: `${liquidityWidthRem}rem`,
        }}
      >
        <div
          style={{
            flex: "50%",
          }}
          className="Liquidity"
        >
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 1rem 0.5rem" }}>
            <div style={{ ...labelStyle, fontWeight: 500 }}>Total</div>

            <div style={balanceWrapperStyle}>
              <CustomBalance balance={dexLiquidity} etherMode size="1rem" padding={0} noClick customColor={totalCol} />
            </div>
          </div>
          <Descriptions bordered size="small" style={{ width: "100%" }}>
            {[0, 1].map(idx => (
              <Descriptions.Item label={<span style={labelStyle}>{idx === 0 ? "SRT" : "ETH"}</span>} span={6}>
                <div style={{ ...balanceWrapperStyle, opacity: 0.8 }}>
                  <CustomBalance
                    balance={idx === 0 ? dexTokenBalance : dexEthBalance}
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
            flex: "50%",
            display: "flex",
            flexDirection: "column",
          }}
          className="Liquidity"
        >
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 1rem 0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ ...labelStyle, fontWeight: 500 }}>Yours</div>
              {ownLiquidityHelp}
            </div>

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
          <Descriptions bordered size="small" style={{ width: "100%" }} className="ThemedDescription">
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
                    customColor={primaryColor}
                  />
                </div>
              </Descriptions.Item>
            ))}
          </Descriptions>
          <div
            style={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              marginTop: "1rem",
              marginLeft: "auto",
              width: "9rem",
              color: softTextColor,
              borderRadius: "0.25rem",
              background: softBg,
            }}
          >
            <div
              style={{
                textAlign: "center",
                flexGrow: 1,
                background: isLightTheme ? nestedCardBGLight : nestedCardBGDark,
                height: "calc(100% - 2px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderTop: `1px solid ${isLightTheme ? "#dedede" : "#666"}`,
                borderLeft: `1px solid ${isLightTheme ? "#dedede" : "#666"}`,
                borderBottom: `1px solid ${isLightTheme ? "#dedede" : "#666"}`,
              }}
            >
              Manage
            </div>
            <Button
              type="default"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                color: softTextColor,
                padding: "0.5rem",
              }}
              onClick={toggleDepositsVisibility}
            >
              <div
                style={{
                  transition: "all 0.3s ease-out",
                  transform: depositsHeight === 0 ? "translateY(0.05rem)" : "rotateX(180deg) translateY(0.05rem)",
                }}
              >
                <DownOutlined />
              </div>
            </Button>
          </div>
        </div>
      </div>

      <div
        style={{
          maxHeight: depositsHeight,
          overflow: "hidden",
          transition: "all 0.3s ease-out",
        }}
      >
        <LiquidityEdit />
      </div>
    </div>
  );
};
export default Liquidity;
