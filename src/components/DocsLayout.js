"use client";

import { useEffect, useState } from "react";

const DEFAULT_LEFT_WIDTH = 280;
const DEFAULT_RIGHT_WIDTH = 300;
const MIN_LEFT_WIDTH = 220;
const MIN_RIGHT_WIDTH = 240;
const MAX_SIDE_WIDTH = 440;
const MIN_CONTENT_WIDTH = 480;
const COLLAPSE_OFFSET = 24;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export default function DocsLayout({ navigation, content, sidebar }) {
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT_WIDTH);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    const savedLeft = Number(window.localStorage.getItem("docs-left-width"));
    const savedRight = Number(window.localStorage.getItem("docs-right-width"));
    if (Number.isFinite(savedLeft) && savedLeft > 0) setLeftWidth(clamp(savedLeft, MIN_LEFT_WIDTH, MAX_SIDE_WIDTH));
    if (Number.isFinite(savedRight) && savedRight > 0) setRightWidth(clamp(savedRight, MIN_RIGHT_WIDTH, MAX_SIDE_WIDTH));
    setLeftCollapsed(window.localStorage.getItem("docs-left-collapsed") === "true");
    setRightCollapsed(window.localStorage.getItem("docs-right-collapsed") === "true");
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
    root.style.setProperty("--docs-left-width", leftCollapsed ? "0px" : `${leftWidth}px`);
    root.style.setProperty("--docs-right-width", rightCollapsed ? "0px" : `${rightWidth}px`);
    window.localStorage.setItem("docs-left-width", String(leftWidth));
    window.localStorage.setItem("docs-right-width", String(rightWidth));
    window.localStorage.setItem("docs-left-collapsed", String(leftCollapsed));
    window.localStorage.setItem("docs-right-collapsed", String(rightCollapsed));
  }, [leftCollapsed, leftWidth, rightCollapsed, rightWidth]);

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
      if (pointerX < MIN_LEFT_WIDTH - COLLAPSE_OFFSET) {
        setLeftCollapsed(true);
        setDragging(null);
        return;
      }

      const reservedRightWidth = rightCollapsed ? 0 : rightWidth;
      const available = window.innerWidth - reservedRightWidth - MIN_CONTENT_WIDTH;
      setLeftWidth(clamp(pointerX, MIN_LEFT_WIDTH, Math.min(MAX_SIDE_WIDTH, available)));
      return;
    }

    const pointerWidth = window.innerWidth - pointerX;
    if (pointerWidth < MIN_RIGHT_WIDTH - COLLAPSE_OFFSET) {
      setRightCollapsed(true);
      setDragging(null);
      return;
    }

    const reservedLeftWidth = leftCollapsed ? 0 : leftWidth;
    const available = window.innerWidth - reservedLeftWidth - MIN_CONTENT_WIDTH;
    setRightWidth(clamp(pointerWidth, MIN_RIGHT_WIDTH, Math.min(MAX_SIDE_WIDTH, available)));
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

    if (side === "left") {
      if (direction < 0 && leftWidth === MIN_LEFT_WIDTH) setLeftCollapsed(true);
      else setLeftWidth((width) => clamp(width + direction * 16, MIN_LEFT_WIDTH, MAX_SIDE_WIDTH));
      return;
    }

    if (direction > 0 && rightWidth === MIN_RIGHT_WIDTH) setRightCollapsed(true);
    else setRightWidth((width) => clamp(width - direction * 16, MIN_RIGHT_WIDTH, MAX_SIDE_WIDTH));
  }

  const layoutStyle = {
    "--docs-left-width": leftCollapsed ? "0px" : `${leftWidth}px`,
    "--docs-right-width": rightCollapsed ? "0px" : `${rightWidth}px`,
  };

  return (
    <div className="docs-layout-grid grid w-full flex-1 grid-cols-1" style={layoutStyle}>
      <div className="docs-layout-slot docs-layout-navigation-slot" data-collapsed={leftCollapsed}>
        {navigation}
      </div>
      <div className="docs-layout-slot docs-layout-content-slot">
        {content}
      </div>
      <div className="docs-layout-slot docs-layout-information-slot" data-collapsed={rightCollapsed}>
        {sidebar}
      </div>

      <div
        role="separator"
        aria-label="Resize documentation navigation"
        aria-orientation="vertical"
        aria-valuemin={MIN_LEFT_WIDTH}
        aria-valuemax={MAX_SIDE_WIDTH}
        aria-valuenow={leftWidth}
        tabIndex={0}
        className={`docs-resize-handle docs-resize-handle-left hidden lg:block ${leftCollapsed ? "lg:!hidden" : ""}`}
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
        className={`docs-resize-handle docs-resize-handle-right hidden lg:block ${rightCollapsed ? "lg:!hidden" : ""}`}
        onKeyDown={(event) => handleKeyDown(event, "right")}
        onPointerDown={(event) => handlePointerDown(event, "right")}
        onPointerMove={(event) => dragging === "right" && resize("right", event.clientX)}
        onPointerUp={() => setDragging(null)}
        onPointerCancel={() => setDragging(null)}
      />

      <button
        type="button"
        aria-label="Expand documentation navigation"
        className={`docs-expand-button docs-expand-button-left hidden lg:block ${leftCollapsed ? "" : "lg:!hidden"}`}
        onClick={() => setLeftCollapsed(false)}
      >
        <span aria-hidden="true">›</span>
      </button>
      <button
        type="button"
        aria-label="Expand documentation information sidebar"
        className={`docs-expand-button docs-expand-button-right hidden lg:block ${rightCollapsed ? "" : "lg:!hidden"}`}
        onClick={() => setRightCollapsed(false)}
      >
        <span aria-hidden="true">‹</span>
      </button>
    </div>
  );
}
