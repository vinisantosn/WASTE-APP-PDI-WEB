import React, { useRef, useEffect, useState } from "react";
import updateCanvas from "./canvas-procedimentos";

const Detector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    const getVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, aspectRatio: 1 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setErro(true);
      }
    };

    getVideo();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    let requestAnimationFrameId: number | undefined;

    const drawVideoOnCanvas = () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext("2d", {
          willReadFrequently: true,
        });

        if (context) {
          console.log("updatecanvas");
          updateCanvas(videoRef.current, canvasRef.current, context);
        }
      }
      requestAnimationFrameId = requestAnimationFrame(drawVideoOnCanvas);
    };

    drawVideoOnCanvas();

    return () => {
      if (requestAnimationFrameId !== undefined) {
        cancelAnimationFrame(requestAnimationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        const _size = Math.min(window.innerWidth, window.innerHeight);
        const size = Math.min(_size, 700);
        canvasRef.current.width = size;
        canvasRef.current.height = size;
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className="detector-container">
      {erro ? (
        <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
          <p className="error-text" style={{ textAlign: "center" }}>
            Permissão Negada! Para autorizar o acesso á câmera acesse as
            configurações do seu navegador.
          </p>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay style={{ display: "none" }} />
          <div className="large-space"></div>
          <canvas ref={canvasRef} />
        </>
      )}
    </div>
  );
};

export default Detector;
