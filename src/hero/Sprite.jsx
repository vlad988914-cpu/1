import React, { useEffect, useMemo, useRef } from "react";
import { m } from "framer-motion";
import { shapesBBox, inflateBBox } from "./geometry.js";

/**
 * SpriteBox — вирізає з оригінального зображення потрібні контури в окремий canvas
 * і розташовує його точно поверх основи (позиція/розмір у відсотках від «світу»).
 * Завдяки цьому будь-яку зону можна підсвічувати, зсувати чи обертати як самостійний шар,
 * а зміна контуру в конфігу одразу змінює спрайт — без окремих PNG.
 */
export const SpriteBox = React.forwardRef(function SpriteBox(
  { image, imageSize, shapes, margin = 3, quality = 2, className = "", style, children, ...rest },
  ref
) {
  const canvasRef = useRef(null);
  const bbox = useMemo(() => inflateBBox(shapesBBox(shapes), margin, imageSize), [shapes, margin, imageSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    let ctx = null;
    try {
      ctx = canvas.getContext("2d");
    } catch (e) {
      ctx = null;
    }
    if (!ctx) return;
    const dpr = Math.min(quality, Math.max(1, (typeof window !== "undefined" && window.devicePixelRatio) || 1));
    canvas.width = Math.ceil(bbox.w * dpr);
    canvas.height = Math.ceil(bbox.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, bbox.w, bbox.h);
    ctx.beginPath();
    shapes.forEach((poly) => {
      poly.forEach(([x, y], i) => (i ? ctx.lineTo(x - bbox.x, y - bbox.y) : ctx.moveTo(x - bbox.x, y - bbox.y)));
      ctx.closePath();
    });
    ctx.save();
    ctx.clip();
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, -bbox.x, -bbox.y);
    ctx.restore();
  }, [image, shapes, bbox, quality]);

  const box = {
    left: `${(bbox.x / imageSize.width) * 100}%`,
    top: `${(bbox.y / imageSize.height) * 100}%`,
    width: `${(bbox.w / imageSize.width) * 100}%`,
    height: `${(bbox.h / imageSize.height) * 100}%`,
  };
  return (
    <m.div ref={ref} className={`hx-sprite ${className}`} style={{ ...box, ...style }} {...rest}>
      <canvas ref={canvasRef} className="hx-sprite-canvas" aria-hidden="true" />
      {children}
    </m.div>
  );
});

export { shapesBBox, inflateBBox };
