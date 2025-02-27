// @ts-check

importScripts("https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js");

const IMG_SIZE = 640;
const IOU_THRESHOLD = 0.7;
const onnxModelUrl = "/onnx/model.onnx";
const onnxWasmUrl = "/onnx/wasm/ort-wasm-simd-threaded.wasm";

function imageDataToOnnxTensor(imageData) {
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

let model;

async function getModel() {
  if (model) {
    console.log("model encontrado");
    return model;
  }

  console.log("criando model");
  model = await ort.InferenceSession.create(onnxModelUrl);
  return model;
}

async function detect(imageData, confidense) {
  console.log(ort);
  const inputTensor = imageDataToOnnxTensor(imageData);
  const _model = await getModel();
  const { output0: outputTensor } = await _model.run({
    images: inputTensor,
  });
  const detections = postprocess(outputTensor, confidense, IOU_THRESHOLD);
  return detections;
}

function postprocess(outputTensors, confThreshold, iouThreshold) {
  const data = outputTensors.data;
  const [batchSize, detectionAttributeSize, numDetections] = outputTensors.dims;

  if (batchSize !== 1) throw new Error("Somente batch size 1 é suportado.");

  const numClasses = detectionAttributeSize - 4;

  const xOffset = 0 * numDetections;
  const yOffset = 1 * numDetections;
  const wOffset = 2 * numDetections;
  const hOffset = 3 * numDetections;

  const detections = [];

  for (let i = 0; i < numDetections; i++) {
    let maxConf = 0.0;
    let bestClass = -1;

    for (let c = 0; c < numClasses; c++) {
      const conf = data[i + (4 + c) * numDetections];
      if (conf > maxConf) {
        maxConf = conf;
        bestClass = c;
      }
    }

    if (maxConf <= confThreshold) continue;

    const cx = data[i + xOffset];
    const cy = data[i + yOffset];
    const w = data[i + wOffset];
    const h = data[i + hOffset];

    const x1 = cx - w / 2;
    const y1 = cy - h / 2;

    detections.push({
      classId: bestClass,
      confidence: maxConf,
      box: { x: x1, y: y1, width: w, height: h },
    });
  }

  if (detections.length === 0) return detections;

  return applyNMS(detections, iouThreshold);
}

function applyNMS(detections, iouThreshold) {
  detections.sort((a, b) => b.confidence - a.confidence);

  const selectedDetections = [];
  const usedIndices = new Array(detections.length).fill(false);

  for (let i = 0; i < detections.length; i++) {
    if (usedIndices[i]) continue;

    const a = detections[i];
    selectedDetections.push(a);

    for (let j = i + 1; j < detections.length; j++) {
      if (usedIndices[j]) continue;

      const b = detections[j];
      const iou = computeIoU(a.box, b.box);

      if (iou > iouThreshold) {
        usedIndices[j] = true;
      }
    }
  }

  return selectedDetections;
}

function computeIoU(boxA, boxB) {
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

onmessage = async function (e) {
  const { imageData, confidense } = e.data;
  const detections = await detect(imageData, confidense);
  postMessage({ detections });
};
