import { useEffect, useRef, useState } from "react";
import { AUDIO, VIDEO } from "../constants";
import { Quadrant } from "../enums";
import { Canvas } from "./Canvas";
import styled from "styled-components";
import { debounce } from "lodash";

const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;

  .dragger {
    position: absolute;
    width: 20px;
    height: 20px;
    background-color: #fff;
    border-radius: 50%;
    box-shadow: 0px 0px 4px 5px rgba(0, 0, 0, 0.3);

    left: 50%;
    top: 50%;
    margin-left: -10px;
    margin-top: -10px;
  }

  .label {
    position: absolute;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;

    &.label-1 {
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
    }

    &.label-2 {
      bottom: 4px;
      left: 4px;
    }

    &.label-3 {
      bottom: 4px;
      right: 4px;
    }
  }
`;

const getWidth = () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const size = Math.min(w, h);

  if (size > 720) {
    return 720;
  }

  return size;
};

export const Player = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const audioElement1 = new Audio();
  const audioElement2 = new Audio();
  const audioElement3 = new Audio();

  const [size, _size] = useState<number>(getWidth());

  const [videoLoaded, _videoLoaded] = useState<boolean>(false);
  const [audioLoaded, _audioLoaded] = useState<boolean>(false);
  const [quadrant, _quadrant] = useState<Quadrant>(Quadrant.TopLeft);
  const [ready, _ready] = useState<boolean>(false);

  const ac = new AudioContext();
  const mergerNode = new ChannelMergerNode(ac, { numberOfInputs: 8 });

  const [volumeNode1, setVolumeNode1] = useState<GainNode | undefined>();
  const [volumeNode2, setVolumeNode2] = useState<GainNode | undefined>();
  const [volumeNode3, setVolumeNode3] = useState<GainNode | undefined>();

  const [x, _x] = useState<number>(window.innerWidth / 2);
  const [y, _y] = useState<number>(window.innerWidth / 2);

  //   const [dragRef, x, y, isDragging] = useDragging();

  useEffect(() => {
    async function init() {
      await loadVideo();
      await loadAudio(AUDIO.bass, audioElement1);
      await loadAudio(AUDIO.sax, audioElement2);
      await loadAudio(AUDIO.guitar, audioElement3);

      initAudio();

      const v = videoRef!.current!;
      v.play();
      playAudio();

      v.addEventListener("ended", (_) => {
        v.currentTime = 0;
        v.play();
      });

      updatePosition(size / 2, size / 2);

      _ready(true);
    }

    init();
  }, []);

  const loadVideo = () =>
    new Promise<void>((resolve, reject) => {
      if (videoLoaded) return;
      const v = videoRef!.current!;
      v.src = VIDEO.url;
      v.addEventListener("canplaythrough", () => {
        _videoLoaded(true);
        resolve();

        // removeEventListener("canplay", () => {}, false); // TODO: fix this
      });
      v.load();
    });

  const loadAudio = (url: string, a: HTMLAudioElement) =>
    new Promise<void>((resolve, reject) => {
      a.crossOrigin = "anonymous";
      a.src = url;
      a.addEventListener("canplaythrough", () => {
        resolve();
      });
      a.addEventListener("ended", () => {
        a.currentTime = 0;
        a.play();
      });
      a.load();
    });

  const initAudio = () => {
    setVolumeNode1(addChannel(audioElement1));
    setVolumeNode2(addChannel(audioElement2));
    setVolumeNode3(addChannel(audioElement3));
  };

  const addChannel = (element: HTMLAudioElement): GainNode => {
    const src = ac.createMediaElementSource(element);
    const volumeNode = ac.createGain();

    volumeNode.gain.value = 1;
    const splitterNode = new ChannelSplitterNode(ac, { numberOfOutputs: 1 });
    src.connect(splitterNode);
    splitterNode.connect(volumeNode, 0);

    volumeNode.connect(mergerNode, 0, 0);
    volumeNode.connect(mergerNode, 0, 1);
    mergerNode.connect(ac.destination);
    return volumeNode;
  };

  const playAudio = () => {
    if (ac.state === "suspended") {
      ac.resume();
    }
    audioElement1.play();
    audioElement2.play();
    audioElement3.play();
  };

  const getDistance = (x1: number, x2: number, y1: number, y2: number) => {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  };

  const updatePosition = (posX: number, posY: number) => {
    _x(posX);
    _y(posY);

    const tmCoord = [size / 2, 0];
    const blCoord = [0, size];
    const brCoord = [size, size];
    const mCoord = [size / 2, size / 2];

    const distanceFromTm = getDistance(posX, tmCoord[0], posY, tmCoord[1]);
    const distanceFromBl = getDistance(posX, blCoord[0], posY, blCoord[1]);
    const distanceFromBr = getDistance(posX, brCoord[0], posY, brCoord[1]);
    const distanceFromM = getDistance(posX, mCoord[0], posY, mCoord[1]);

    let distances = [
      { k: "tm", v: distanceFromTm },
      { k: "bl", v: distanceFromBl },
      { k: "br", v: distanceFromBr },
      { k: "m", v: distanceFromM },
    ];

    const sorted = distances.sort((a, b) => (a.v < b.v ? -1 : 1));

    const closest = sorted[0].k;

    switch (closest) {
      case "tm":
        if (quadrant != Quadrant.TopLeft) {
          _quadrant(Quadrant.TopLeft);
        }
        break;
      case "bl":
        if (quadrant != Quadrant.BottomLeft) {
          _quadrant(Quadrant.BottomLeft);
        }
        break;
      case "br":
        if (quadrant != Quadrant.TopRight) {
          _quadrant(Quadrant.TopRight);
        }
        break;
      default:
        if (quadrant != Quadrant.BottomRight) {
          _quadrant(Quadrant.BottomRight);
        }
    }

    const fraction1 = 1 - distanceFromTm / size;
    const fraction2 = 1 - distanceFromBl / size;
    const fraction3 = 1 - distanceFromBr / size;

    if (volumeNode1) {
      volumeNode1.gain.value = fraction1 * 2;
    }

    if (volumeNode2) {
      volumeNode2.gain.value = fraction2 * 2;
    }
    if (volumeNode3) {
      volumeNode3.gain.value = fraction3 * 2;
    }
  };

  return (
    <>
      <div
        style={{
          position: "relative",
          opacity: ready ? 1 : 0,
          width: size,
          height: size,
        }}
      >
        <Canvas videoRef={videoRef} quadrant={quadrant} outputSize={size} />

        <Overlay
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const debouncedUpdate = debounce(
              () => updatePosition(touch.clientX, touch.clientY),
              10
            );
            debouncedUpdate();
          }}
          onClick={(e) => {
            updatePosition(e.clientX, e.clientY);
            const debouncedUpdate = debounce(
              () => updatePosition(e.clientX, e.clientY),
              10
            );
            debouncedUpdate();
          }}
        >
          <div className="label label-1">BASS</div>
          <div className="label label-2">SAX</div>
          <div className="label label-3">GUITAR</div>
          <div
            className="dragger"
            ref={dragRef}
            style={{
              left: `${x}px`,
              top: `${y}px`,
            }}
          ></div>
        </Overlay>
      </div>
      <div>
        <button onClick={() => _quadrant(Quadrant.TopLeft)}>1</button>
        <button onClick={() => _quadrant(Quadrant.TopRight)}>2</button>
        <button onClick={() => _quadrant(Quadrant.BottomLeft)}>3</button>
        <button onClick={() => _quadrant(Quadrant.BottomRight)}>4</button>
      </div>

      <video muted playsInline ref={videoRef} style={{ opacity: 0 }} />
    </>
  );
};
