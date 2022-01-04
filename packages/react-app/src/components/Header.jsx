import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="/" /*target="_blank" rel="noopener noreferrer"*/>
      <PageHeader title="🏗 scaffold-eth" subTitle="Minimum Viable So Rad DEX" style={{ cursor: "pointer" }} />
    </a>
  );
}
