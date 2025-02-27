import { FC, useRef } from "react";
import * as ort from "onnxruntime-web";

ort.env.wasm.wasmPaths = {
  wasm: "/ort-wasm-simd-threaded.wasm",
  // Add other WASM files as needed
};

const OnnxPage: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function run() {
    if (!imgRef.current || !canvasRef.current) {
      return;
    }
    const context = canvasRef.current.getContext("2d");
    if (!context) return;
    canvasRef.current.width = 640;
    canvasRef.current.height = 640;

    context.drawImage(imgRef.current, 0, 0, 640, 640);

    const imageData = context.getImageData(0, 0, 640, 640);

    const pixels = imageData.data;

    const red = [];
    const green = [];
    const blue = [];
    for (let index = 0; index < pixels.length; index += 4) {
      red.push(pixels[index] / 255.0);
      green.push(pixels[index + 1] / 255.0);
      blue.push(pixels[index + 2] / 255.0);
    }
    const input = [...red, ...green, ...blue];

    const inputTensor = new ort.Tensor(Float32Array.from(input), [
      1,
      3,
      imageData.width,
      imageData.height,
    ]);
    console.log(inputTensor);
    (async () => {
      console.log("carregando modelo");
      console.log(ort.env.wasm.wasmPaths);
      const model = await ort.InferenceSession.create("/model/model.onnx");
      console.log("processando");
      const { output0: output } = await model.run({ images: inputTensor });
      console.log(output);
      console.log(output.dims);
      const res = postprocess(output, 0.2, 0.7);
      console.log(res);

      res.forEach((r) => {
        context.strokeStyle = "red";
        context.lineWidth = 4;
        context.strokeRect(r.box.x, r.box.y, r.box.width, r.box.height);
      });
    })();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h1>Onnx</h1>
      <article>
        <h5>Imagem de Teste</h5>
        <img ref={imgRef} src="/model/ferrugem.jpg" />
        <button onClick={run}>Rodar</button>
      </article>

      <article>
        <h5>Canvas</h5>
        <canvas ref={canvasRef} style={{ width: 640, height: 640 }}></canvas>
      </article>
    </div>
  );
};

interface Detection {
  classId: number;
  confidence: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

function postprocess(
  outputTensors: ort.Tensor, // ONNX runtime tensor output
  confThreshold: number,
  iouThreshold: number
): Detection[] {
  // Obtenha os dados brutos e a forma do tensor de saída
  const data = outputTensors.data as Float32Array;
  const [batchSize, detectionAttributeSize, numDetections] = outputTensors.dims;

  // Verifique os tamanhos (segurança extra)
  if (batchSize !== 1) throw new Error("Somente batch size 1 é suportado.");

  const numClasses = detectionAttributeSize - 4;

  // Pre-calcular os offsets para coordenadas das bounding boxes
  const xOffset = 0 * numDetections;
  const yOffset = 1 * numDetections;
  const wOffset = 2 * numDetections;
  const hOffset = 3 * numDetections;

  const detections: Detection[] = [];

  // Processar cada detecção
  for (let i = 0; i < numDetections; i++) {
    let maxConf = 0.0;
    let bestClass = -1;

    // Encontrar a classe com maior confiança
    for (let c = 0; c < numClasses; c++) {
      const conf = data[i + (4 + c) * numDetections];
      if (conf > maxConf) {
        maxConf = conf;
        bestClass = c;
      }
    }

    // Filtrar detecções com baixa confiança
    if (maxConf <= confThreshold) continue;

    // Obter as coordenadas da bounding box
    const cx = data[i + xOffset];
    const cy = data[i + yOffset];
    const w = data[i + wOffset];
    const h = data[i + hOffset];

    // Converter do formato (cx, cy, w, h) para (x1, y1, largura, altura)
    const x1 = cx - w / 2;
    const y1 = cy - h / 2;

    // Adicionar a detecção
    detections.push({
      classId: bestClass,
      confidence: maxConf,
      box: { x: x1, y: y1, width: w, height: h },
    });
  }

  // Se não houver detecções, retorne vazio
  if (detections.length === 0) return detections;

  // Non-Maximum Suppression (NMS)
  return applyNMS(detections, iouThreshold);
}

// Implementação de Non-Maximum Suppression (NMS)
function applyNMS(detections: Detection[], iouThreshold: number): Detection[] {
  // Ordenar detecções por confiança em ordem decrescente
  detections.sort((a, b) => b.confidence - a.confidence);

  const selectedDetections: Detection[] = [];
  const usedIndices: boolean[] = new Array(detections.length).fill(false);

  for (let i = 0; i < detections.length; i++) {
    if (usedIndices[i]) continue;

    const a = detections[i];
    selectedDetections.push(a);

    for (let j = i + 1; j < detections.length; j++) {
      if (usedIndices[j]) continue;

      const b = detections[j];
      const iou = computeIoU(a.box, b.box);

      // Suprimir detecções que se sobrepõem acima do limiar de IoU
      if (iou > iouThreshold) {
        usedIndices[j] = true;
      }
    }
  }

  return selectedDetections;
}

// Função para calcular Intersection Over Union (IoU)
function computeIoU(
  boxA: { x: number; y: number; width: number; height: number },
  boxB: { x: number; y: number; width: number; height: number }
): number {
  const x1 = Math.max(boxA.x, boxB.x);
  const y1 = Math.max(boxA.y, boxB.y);
  const x2 = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const y2 = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;

  const union = areaA + areaB - intersection;

  return intersection / union;
}

export default OnnxPage;
