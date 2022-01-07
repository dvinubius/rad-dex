import { ArrowRightOutlined, LineOutlined } from "@ant-design/icons";
import React, { useRef, useEffect, useContext } from "react";
import { ThemeContext } from "../App";
import { curveGradient } from "../styles";

export default function Curve({ addingEth, addingToken, ethReserve, tokenReserve, width, height }) {
  const { theme } = useContext(ThemeContext);

  let ref = useRef();
  const isLightTheme = theme === "light";

  const drawArrow = (ctx, x1, y1, x2, y2) => {
    let [dx, dy] = [x1 - x2, y1 - y2];
    let norm = Math.sqrt(dx * dx + dy * dy);
    let [udx, udy] = [dx / norm, dy / norm];
    // const size = norm / 7;
    const size = Math.pow(Math.max(Math.abs(dx), Math.abs(dy)), 0.45);

    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + udx * size * 2 - (udy * size) / 1.5, y2 + (udx * size) / 1.5 + udy * size * 2);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + udx * size * 2 + (udy * size) / 1.5, y2 - (udx * size) / 1.5 + udy * size * 2);
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

      const doPlot = +addingEth || +addingToken;

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
      ctx.strokeStyle = isLightTheme ? "#333" : "#bbb";
      ctx.fillStyle = isLightTheme ? "#333" : "#bbb";

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

      ctx.lineWidth = isLightTheme ? 2 : doPlot ? 2 : 1;
      ctx.strokeStyle = doPlot ? "hsla(328, 100%, 54%, 0.5)" : isLightTheme ? "#dddddd" : "#999";
      ctx.fillStyle = doPlot ? "hsla(328, 100%, 54%, 0.5)" : isLightTheme ? "#dddddd" : "#999";

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

      const plotTextColor = isLightTheme ? "#111" : "#efefef";
      const startColor = doPlot ? "hsla(328, 100%, 54%, 1)" : "#dddddd";
      const destinationColor = "hsla(328, 40%, 54%, 1)";
      const arrowColor = isLightTheme ? "hsla(328, 80%, 24%, 0.4)" : "hsla(328, 80%, 44%, 0.6)";

      if (+addingEth) {
        let newEthReserve = ethReserve + parseFloat(addingEth);

        ctx.strokeStyle = arrowColor;
        drawArrow(ctx, plotX(ethReserve), plotY(tokenReserve), plotX(newEthReserve), plotY(tokenReserve));

        ctx.fillStyle = plotTextColor;
        ctx.fillText("" + addingEth + " ETH in", plotX(ethReserve) + textSize, plotY(tokenReserve) - textSize);

        ctx.strokeStyle = arrowColor;
        drawArrow(ctx, plotX(newEthReserve), plotY(tokenReserve), plotX(newEthReserve), plotY(k / newEthReserve));

        let amountGained = Math.round((10000 * (addingEth * tokenReserve)) / newEthReserve) / 10000;
        ctx.fillStyle = plotTextColor;
        ctx.fillText(
          "" + amountGained + " SRT out",
          plotX(newEthReserve) + textSize,
          plotY(k / newEthReserve) - 4 * textSize,
        );
        ctx.fillText("(-0.3% fee)", plotX(newEthReserve) + textSize, plotY(k / newEthReserve) - 2.5 * textSize);

        ctx.fillStyle = destinationColor;
        ctx.beginPath();
        ctx.arc(plotX(newEthReserve), plotY(k / newEthReserve), 5, 0, 2 * Math.PI);
        ctx.fill();
      } else if (+addingToken) {
        let newTokenReserve = tokenReserve + parseFloat(addingToken);

        //console.log("newTokenReserve",newTokenReserve)
        ctx.strokeStyle = arrowColor;
        drawArrow(ctx, plotX(ethReserve), plotY(tokenReserve), plotX(ethReserve), plotY(newTokenReserve));

        ctx.fillStyle = plotTextColor;
        ctx.fillText("" + addingToken + " SRT in", plotX(ethReserve) + textSize, plotY(tokenReserve));

        ctx.strokeStyle = arrowColor;
        drawArrow(ctx, plotX(ethReserve), plotY(newTokenReserve), plotX(k / newTokenReserve), plotY(newTokenReserve));

        let amountGained = Math.round((10000 * (addingToken * ethReserve)) / newTokenReserve) / 10000;
        //console.log("amountGained",amountGained)
        ctx.fillStyle = plotTextColor;
        ctx.fillText(
          "" + amountGained + " ETH out",
          plotX(k / newTokenReserve) + textSize,
          plotY(newTokenReserve) - textSize * 4,
        );
        ctx.fillText("(-0.3% fee)", plotX(k / newTokenReserve) + textSize, plotY(newTokenReserve) - textSize * 2.5);
        ctx.fillStyle = destinationColor;
        ctx.beginPath();
        ctx.arc(plotX(k / newTokenReserve), plotY(newTokenReserve), 5, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = startColor;
      ctx.beginPath();
      ctx.arc(plotX(ethReserve), plotY(tokenReserve), 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [addingEth, addingToken, ethReserve, tokenReserve]);

  const borderCol = isLightTheme ? "#f3f3f3" : "#999";
  const axisLabelsCol = isLightTheme ? "#444" : "#aaa";
  return (
    <div style={{ padding: "2rem", background: curveGradient, border: `1px solid ${borderCol}` }}>
      <div style={{ position: "relative", width: width, height: height }}>
        <canvas style={{ position: "absolute", left: 0, top: 0 }} ref={ref} width={width} height={height} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "-1.5rem",
            color: axisLabelsCol,
          }}
        >
          <div style={{ marginRight: "1rem", transform: "scaleX(2)" }}>
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
            left: "-1.5rem",
            bottom: "50%",
            transform: "rotate(-90deg) translateX(-50%)",
            transformOrigin: "0 0",
            color: axisLabelsCol,
          }}
        >
          <div style={{ marginRight: "1rem", transform: "scaleX(2)" }}>
            <LineOutlined />
          </div>
          SRT Reserve{" "}
          <div style={{ transform: "scaleX(2) translateX(50%)" }}>
            <ArrowRightOutlined />
          </div>
        </div>
      </div>
    </div>
  );
}
