import * as ort from "onnxruntime-web";
const IMG_SIZE = 640;
const IOU_THRESHOLD = 0.7;

function imageDataToOnnxTensor(imageData: ImageData): ort.Tensor {
  if (imageData.height !== IMG_SIZE || imageData.width !== IMG_SIZE) {
    throw new Error(`Image must be ${IMG_SIZE}x${IMG_SIZE}`);
  }

  const pixels = imageData.data;

  const red = [];
  const green = [];
  const blue = [];
  for (let index = 0; index < pixels.length; index += 4) {
    red.push(pixels[index] / 255.0);
    green.push(pixels[index + 1] / 255.0);
    blue.push(pixels[index + 2] / 255.0);
  }
  const data = [...red, ...green, ...blue];

  const imageTensor = new ort.Tensor(Float32Array.from(data), [
    1,
    3,
    imageData.width,
    imageData.height,
  ]);

  return imageTensor;
}

async function createDetectionModel(
  onnxModelUrl: string
): Promise<IDetectionModel> {
  const model = await ort.InferenceSession.create(onnxModelUrl);
  return new DetectionModel(model);
}

export class DetectionModel implements IDetectionModel {
  constructor(private model: ort.InferenceSession) {}

  async detect(
    inputTensor: ort.Tensor,
    confidense: number
  ): Promise<Detection[]> {
    const { output0: outputTensor } = await this.model.run({
      images: inputTensor,
    });
    const detections = this.postprocess(
      outputTensor,
      confidense,
      IOU_THRESHOLD
    );
    return detections;
  }

  private postprocess(
    outputTensors: ort.Tensor, // ONNX runtime tensor output
    confThreshold: number,
    iouThreshold: number
  ): Detection[] {
    // Obtenha os dados brutos e a forma do tensor de saída
    const data = outputTensors.data as Float32Array;
    const [batchSize, detectionAttributeSize, numDetections] =
      outputTensors.dims;

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
    return this.applyNMS(detections, iouThreshold);
  }

  // Implementação de Non-Maximum Suppression (NMS)
  private applyNMS(detections: Detection[], iouThreshold: number): Detection[] {
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
        const iou = this.computeIoU(a.box, b.box);

        // Suprimir detecções que se sobrepõem acima do limiar de IoU
        if (iou > iouThreshold) {
          usedIndices[j] = true;
        }
      }
    }

    return selectedDetections;
  }

  // Função para calcular Intersection Over Union (IoU)
  private computeIoU(
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
}

const OnnxruntimeWebYolo11 = {
  imageDataToOnnxTensor,
  createDetectionModel,
};

Object.freeze(OnnxruntimeWebYolo11);

export interface Detection {
  classId: number;
  confidence: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface IDetectionModel {
  detect(inputTensor: ort.Tensor, confidense: number): Promise<Detection[]>;
}

export default OnnxruntimeWebYolo11;
