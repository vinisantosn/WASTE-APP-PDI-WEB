from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from detection_service import Detector
import base64
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

model = YOLO("./model/food_waste_yolo.pt") 
detector = Detector(model)

def convert(img_base64: str) -> np.ndarray:
    img_bytes = base64.b64decode(img_base64.split(',')[1])
    np_img = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(np_img, cv2.IMREAD_COLOR)

@app.route('/detect', methods=['POST'])
def detect():
    data = request.get_json()
    img_base64 = data['base64_img']
    confidence = data['confianca']

    image = convert(img_base64)
    bounding_boxes = detector.detectar(image, confidence)
    bounding_boxes_dicts = [box.toDict() for box in bounding_boxes]

    response = {
        "metadata": {
            "image_shape": image.shape,
        },
        "data": {
            "bounding_boxes": bounding_boxes_dicts
        }
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)