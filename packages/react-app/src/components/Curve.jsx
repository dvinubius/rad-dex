import { ArrowRightOutlined, LineOutlined } from "@ant-design/icons";
import React, { useRef, useEffect } from "react";

export default function Curve({ addingEth, addingToken, ethReserve, tokenReserve, width, height }) {
  let ref = useRef();

  const drawArrow = (ctx, x1, y1, x2, y2) => {
    let [dx, dy] = [x1 - x2, y1 - y2];
    let norm = Math.sqrt(dx * dx + dy * dy);
    let [udx, udy] = [dx / norm, dy / norm];
    const size = norm / 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + udx * size - udy * size, y2 + udx * size + udy * size);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + udx * size + udy * size, y2 - udx * size + udy * size);
    ctx.stroke();
  };

  useEffect(() => {
    let canvas = ref.current;

    const textSize = 12;

    const width = canvas.width;
    const height = canvas.height;

    if (canvas.getContext && ethReserve && tokenReserve) {
      const k = ethReserve * tokenReserve;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);

      let maxX = k / (ethReserve / 4);
      let minX = 0;

      const doPlot = addingEth || addingToken;

      if (doPlot) {
        maxX = k / (ethReserve * 0.4);
        //maxX = k/(ethReserve*0.8)
        minX = k / Math.max(0, 500 - ethReserve);
      }

      const maxY = (maxX * height) / width;
      const minY = (minX * height) / width;

      const plotX = x => {
        return ((x - minX) / (maxX - minX)) * width;
      };

      const plotY = y => {
        return height - ((y - minY) / (maxY - minY)) * height;
      };
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#000000";

      ctx.font = textSize + "px Arial";
      // +Y axis
      ctx.beginPath();
      ctx.moveTo(plotX(minX), plotY(0));
      ctx.lineTo(plotX(minX), plotY(maxY));
      ctx.stroke();
      // +X axis
      ctx.beginPath();
      ctx.moveTo(plotX(0), plotY(minY));
      ctx.lineTo(plotX(maxX), plotY(minY));
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = doPlot ? "#111111" : "#dddddd";
      ctx.fillStyle = doPlot ? "#111111" : "#dddddd";

      ctx.beginPath();
      let first = true;
      for (var x = minX; x <= maxX; x += maxX / width) {
        /////
        var y = k / x;
        /////
        if (first) {
          ctx.moveTo(plotX(x), plotY(y));
          first = false;
        } else {
          ctx.lineTo(plotX(x), plotY(y));
        }
      }
      ctx.stroke();

      ctx.lineWidth = 1;

      const plotColor = "#111111";
      const startColor = doPlot ? "#0000FF" : "#dddddd";
      const destinationColor = "#bbbbbb";
      const arrowHorizontalColor = "#009900";
      const arrowVerticalColor = "#990000";

      if (addingEth) {
        let newEthReserve = ethReserve + parseFloat(addingEth);

        ctx.fillStyle = destinationColor;
        ctx.beginPath();
        ctx.arc(plotX(newEthReserve), plotY(k / newEthReserve), 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = arrowHorizontalColor;
        drawArrow(ctx, plotX(ethReserve), plotY(tokenReserve), plotX(newEthReserve), plotY(tokenReserve));

        ctx.fillStyle = plotColor;
        ctx.fillText("" + addingEth + " ETH input", plotX(ethReserve) + textSize, plotY(tokenReserve) - textSize);

        ctx.strokeStyle = arrowVerticalColor;
        drawArrow(ctx, plotX(newEthReserve), plotY(tokenReserve), plotX(newEthReserve), plotY(k / newEthReserve));

        let amountGained = Math.round((10000 * (addingEth * tokenReserve)) / newEthReserve) / 10000;
        ctx.fillStyle = plotColor;
        ctx.fillText(
          "" + amountGained + " SRT output (-0.3% fee)",
          plotX(newEthReserve) + textSize,
          plotY(k / newEthReserve),
        );
      } else if (addingToken) {
        let newTokenReserve = tokenReserve + parseFloat(addingToken);

        ctx.fillStyle = destinationColor;
        ctx.beginPath();
        ctx.arc(plotX(k / newTokenReserve), plotY(newTokenReserve), 5, 0, 2 * Math.PI);
        ctx.fill();

        //console.log("newTokenReserve",newTokenReserve)
        ctx.strokeStyle = arrowVerticalColor;
        drawArrow(ctx, plotX(ethReserve), plotY(tokenReserve), plotX(ethReserve), plotY(newTokenReserve));

        ctx.fillStyle = plotColor;
        ctx.fillText("" + addingToken + " SRT input", plotX(ethReserve) + textSize, plotY(tokenReserve));

        ctx.strokeStyle = arrowHorizontalColor;
        drawArrow(ctx, plotX(ethReserve), plotY(newTokenReserve), plotX(k / newTokenReserve), plotY(newTokenReserve));

        let amountGained = Math.round((10000 * (addingToken * ethReserve)) / newTokenReserve) / 10000;
        //console.log("amountGained",amountGained)
        ctx.fillStyle = plotColor;
        ctx.fillText(
          "" + amountGained + " ETH output (-0.3% fee)",
          plotX(k / newTokenReserve) + textSize,
          plotY(newTokenReserve) - textSize,
        );
      }

      ctx.fillStyle = startColor;
      ctx.beginPath();
      ctx.arc(plotX(ethReserve), plotY(tokenReserve), 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [addingEth, addingToken, ethReserve, tokenReserve]);

  return (
    <div style={{ position: "relative", width: width, height: height }}>
      <canvas style={{ position: "absolute", left: 0, top: 0 }} ref={ref} width={width} height={height} />
      <div style={{ display: "flex", alignItems: "center", position: "absolute", left: "20%", bottom: -20 }}>
        <div style={{ marginRight: "0.5rem" }}>
          <LineOutlined />
        </div>
        ETH Reserve{" "}
        <div style={{ transform: "scaleX(2) translateX(50%)" }}>
          <ArrowRightOutlined />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          position: "absolute",
          left: -20,
          bottom: "20%",
          transform: "rotate(-90deg)",
          transformOrigin: "0 0",
        }}
      >
        <div style={{ marginRight: "0.5rem" }}>
          <LineOutlined />
        </div>
        Token Reserve{" "}
        <div style={{ transform: "scaleX(2) translateX(50%)" }}>
          <ArrowRightOutlined />
        </div>
      </div>
    </div>
  );
}
