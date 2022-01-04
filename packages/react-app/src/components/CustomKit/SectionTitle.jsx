import React from "react";

const SectionTitle = ({ text }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: "1rem" }}>
      <span style={{ fontSize: "1.25rem", fontWeight: 400 }}>{text}</span>
    </div>
  );
};

export default SectionTitle;
