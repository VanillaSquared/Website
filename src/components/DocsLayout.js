"use client";

import { useEffect, useState } from "react";

const DEFAULT_LEFT_WIDTH = 280;
const DEFAULT_RIGHT_WIDTH = 300;
const MIN_LEFT_WIDTH = 220;
const MIN_RIGHT_WIDTH = 240;
const MAX_SIDE_WIDTH = 440;
const MIN_CONTENT_WIDTH = 480;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export default function DocsLayout({ navigation, content, sidebar }) {
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT_WIDTH);
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    const savedLeft = Number(window.localStorage.getItem("docs-left-width"));
    const savedRight = Number(window.localStorage.getItem("docs-right-width"));
    if (Number.isFinite(savedLeft) && savedLeft > 0) setLeftWidth(clamp(savedLeft, MIN_LEFT_WIDTH, MAX_SIDE_WIDTH));
    if (Number.isFinite(savedRight) && savedRight > 0) setRightWidth(clamp(savedRight, MIN_RIGHT_WIDTH, MAX_SIDE_WIDTH));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("has-docs-layout");
    return () => {
      root.classList.remove("has-docs-layout");
      root.style.removeProperty("--docs-left-width");
      root.style.removeProperty("--docs-right-width");
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--docs-left-width", `${leftWidth}px`);
    root.style.setProperty("--docs-right-width", `${rightWidth}px`);
    window.localStorage.setItem("docs-left-width", String(leftWidth));
    window.localStorage.setItem("docs-right-width", String(rightWidth));
  }, [leftWidth, rightWidth]);

  useEffect(() => {
    document.body.style.cursor = dragging ? "col-resize" : "";
    document.body.style.userSelect = dragging ? "none" : "";
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging]);

  function resize(side, pointerX) {
    if (side === "left") {
      const reservedRightWidth = window.matchMedia("(min-width: 80rem)").matches ? rightWidth : 0;
      const available = window.innerWidth - reservedRightWidth - MIN_CONTENT_WIDTH;
      setLeftWidth(clamp(pointerX, MIN_LEFT_WIDTH, Math.min(MAX_SIDE_WIDTH, available)));
      return;
    }

    const available = window.innerWidth - leftWidth - MIN_CONTENT_WIDTH;
    setRightWidth(clamp(window.innerWidth - pointerX, MIN_RIGHT_WIDTH, Math.min(MAX_SIDE_WIDTH, available)));
  }

  function handlePointerDown(event, side) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(side);
  }

  function handleKeyDown(event, side) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    if (side === "left") setLeftWidth((width) => clamp(width + direction * 16, MIN_LEFT_WIDTH, MAX_SIDE_WIDTH));
    else setRightWidth((width) => clamp(width - direction * 16, MIN_RIGHT_WIDTH, MAX_SIDE_WIDTH));
  }

  const layoutStyle = {
    "--docs-left-width": `${leftWidth}px`,
    "--docs-right-width": `${rightWidth}px`,
  };

  return (
    <div className="docs-layout-grid grid w-full flex-1 grid-cols-1" style={layoutStyle}>
      {navigation}
      {content}
      {sidebar}

      <div
        role="separator"
        aria-label="Resize documentation navigation"
        aria-orientation="vertical"
        aria-valuemin={MIN_LEFT_WIDTH}
        aria-valuemax={MAX_SIDE_WIDTH}
        aria-valuenow={leftWidth}
        tabIndex={0}
        className="docs-resize-handle docs-resize-handle-left hidden lg:block"
        onKeyDown={(event) => handleKeyDown(event, "left")}
        onPointerDown={(event) => handlePointerDown(event, "left")}
        onPointerMove={(event) => dragging === "left" && resize("left", event.clientX)}
        onPointerUp={() => setDragging(null)}
        onPointerCancel={() => setDragging(null)}
      />
      <div
        role="separator"
        aria-label="Resize documentation information sidebar"
        aria-orientation="vertical"
        aria-valuemin={MIN_RIGHT_WIDTH}
        aria-valuemax={MAX_SIDE_WIDTH}
        aria-valuenow={rightWidth}
        tabIndex={0}
        className="docs-resize-handle docs-resize-handle-right hidden xl:block"
        onKeyDown={(event) => handleKeyDown(event, "right")}
        onPointerDown={(event) => handlePointerDown(event, "right")}
        onPointerMove={(event) => dragging === "right" && resize("right", event.clientX)}
        onPointerUp={() => setDragging(null)}
        onPointerCancel={() => setDragging(null)}
      />
    </div>
  );
}
