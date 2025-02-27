import { classesDoModelo } from "../../../../data";
import { ImageInput, Boundbox, Detector } from "../../types";

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

const worker = new Worker("worker.js");

export default class OnnxDetector implements Detector {
  public async detectar(
    imageInput: ImageInput,
    confianca: number
  ): Promise<Boundbox[]> {
    const imageData = imageInput.getImageData();
    const detections = await new Promise<Detection[]>((resolve, reject) => {
      worker.postMessage({ imageData, confidense: confianca });

      // Ouça as mensagens do Worker
      worker.onmessage = (event) => {
        const { detections, error } = event.data;
        if (error) {
          reject(error);
        } else {
          resolve(detections as Detection[]);
        }
      };

      worker.onerror = (err) => {
        reject(err.message);
      };
    });
    const boundboxes = detections.map(this.detectionToBoundBox);
    return boundboxes;
  }

  private detectionToBoundBox(detection: Detection): Boundbox {
    const boundbox: Boundbox = {
      classe: classesDoModelo[detection.classId] ?? "- - -",
      confianca: detection.confidence,
      x1: detection.box.x,
      y1: detection.box.y,
      x2: detection.box.x + detection.box.width,
      y2: detection.box.y + detection.box.height,
    };
    return boundbox;
  }
}
