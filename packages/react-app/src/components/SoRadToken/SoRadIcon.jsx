import React from "react";

const SoRadIcon = ({ size }) => {
  return (
    <div
      style={{
        border: "1px solid lightgrey",
        borderRadius: "50%",
        // background: "linear-gradient(45deg, rgba(255,0,0,0.35), transparent, rgba(255,0,0,0.35))",
        background: "linear-gradient(45deg, rgba(255, 20, 147, 0.7), transparent, rgba(255, 20, 147, 0.7))",
        width: size || 32,
        height: size || 32,
        position: "relative",
      }}
    >
      <span
        style={{
          fontSize: size * 0.8,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        😎
      </span>
    </div>
  );
};
export default SoRadIcon;
