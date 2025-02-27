from typing import List
from ultralytics import YOLO
import cv2

class BoundBox:
    def __init__(self, x1: float, y1: float, x2: float, y2: float, classe: int, confianca: float):
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.classe = classe
        self.confianca = confianca

    def to_dict(self) -> dict:
        return {
            'x1': self.x1,
            'y1': self.y1,
            'x2': self.x2,
            'y2': self.y2,
            'classe': self.classe,
            'confianca': self.confianca
        }

class Detector:
    def __init__(self, model: YOLO):
        self.model = model

    def detectar(self, img: cv2.typing.MatLike, confianca: float) -> List[BoundBox]:
        results = self.model.predict(
            source=img,
            conf=confianca
        )
        
        detections = results[0].boxes  

        bounding_boxes: List[BoundBox] = []
        for box in detections:
            x1, y1, x2, y2 = box.xyxy[0]  
            classe = int(box.cls[0])  
            confianca = float(box.conf[0])  

            bounding_boxes.append(
                BoundBox(
                    x1=int(x1),
                    y1=int(y1),
                    x2=int(x2),
                    y2=int(y2),
                    classe=classe,
                    confianca=confianca
                )
            )
        return bounding_boxes