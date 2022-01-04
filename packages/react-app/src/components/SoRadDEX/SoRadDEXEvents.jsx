import { SwapOutlined } from "@ant-design/icons";
import { List, Card } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import React from "react";
import { Address, Balance } from "..";
import { softTextCol } from "../../styles";
import CustomAddress from "../CustomKit/CustomAddress";
import CustomBalance from "../CustomKit/CustomBalance";

const SoRadDEXEvents = ({ readContracts, localProvider, mainnetProvider }) => {
  const buyTokensEvents = useEventListener(readContracts, "Vendor", "BuyTokens", localProvider, 1);
  console.log("📟 buyTokensEvents:", buyTokensEvents);

  const sellTokensEvents = useEventListener(readContracts, "Vendor", "SellTokens", localProvider, 1);
  console.log("📟 buyTokensEvents:", buyTokensEvents);

  return (
    <div
      style={{
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "2rem",
      }}
    >
      {[buyTokensEvents, sellTokensEvents].map((events, idx) => (
        <Card
          style={{ width: "21.25rem" }}
          title={<div style={{ fontSize: "1rem" }}>{`${idx === 0 ? "Buy" : "Sell"} SRT`}</div>}
          size="small"
        >
          <div style={{ height: 400, overflowY: "scroll", paddingRight: "1rem" }}>
            <List
              dataSource={events}
              renderItem={item => {
                return (
                  <List.Item key={item.blockNumber + item.blockHash}>
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: "rgba(0,0,0,0.07)",
                          padding: "0.25rem 0.5rem",
                        }}
                      >
                        <span style={{ fontSize: "1rem", color: softTextCol }}>{idx === 0 ? "Buyer" : "Seller"}</span>
                        <CustomAddress value={item.args[0]} ensProvider={mainnetProvider} fontSize={16} />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0 0.5rem",
                        }}
                      >
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <CustomBalance etherMode balance={item.args[1]} padding={0} size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <SwapOutlined /> 
                        </div>
                        <div style={{ flex: 1, textAlign: "right" }}>
                          <CustomBalance customSymbol="SRT" balance={item.args[2]} padding={0} size={18} />
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SoRadDEXEvents;
