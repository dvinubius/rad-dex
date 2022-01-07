import { LinkOutlined } from "@ant-design/icons";
import React from "react";

const TitleWithLink = ({ titleContent, linkURL }) => {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "0.5rem",
      }}
    >
      {titleContent}
      <div
        style={{
          fontSize: "1.25rem",
        }}
      >
        <a href={linkURL} target="blank">
          <LinkOutlined />
        </a>
      </div>
    </div>
  );
};

export default TitleWithLink;
