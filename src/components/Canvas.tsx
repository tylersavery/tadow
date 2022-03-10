import React, { createRef, Ref, useEffect, useRef } from "react";
import { VIDEO } from "../constants";
import { Quadrant } from "../enums";

interface Props {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  quadrant: Quadrant;
  outputSize: number;
}

export const Canvas = (props: Props) => {
  const { videoRef, quadrant, outputSize } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef != null && canvasRef.current && videoRef.current) {
      const c = canvasRef!.current!;
      const v = videoRef!.current!;
      const interval = setInterval(() => {
        const ctx = c.getContext("2d")!;
        if (ctx && v) {
          const coords = sourceCoords();
          //(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
          ctx.drawImage(
            v,
            coords[0],
            coords[1],
            VIDEO.width / 2,
            VIDEO.height / 2,
            0,
            0,
            outputSize,
            outputSize
          );
        }
      }, VIDEO.frameRate);

      return () => clearInterval(interval);
    }
  });

  const sourceCoords = (): number[] => {
    switch (quadrant) {
      case Quadrant.TopLeft:
        return [0, 0];
      case Quadrant.TopRight:
        return [VIDEO.width / 2, 0];
      case Quadrant.BottomLeft:
        return [0, VIDEO.height / 2];
      case Quadrant.BottomLeft:
        return [VIDEO.width / 2, VIDEO.height / 2];
    }
    return [0, 0];
  };

  return <canvas ref={canvasRef} width={outputSize} height={outputSize} />;
};
