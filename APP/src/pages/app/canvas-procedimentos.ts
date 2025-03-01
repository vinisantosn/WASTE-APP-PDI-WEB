import detectorService from "../../services/detector";
import { Boundbox, ImageInput } from "../../services/detector/types";
import { caloriasPorGrama } from "../../data";

export default function updateCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
) {
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (detectorService.podeDetectar) {
    const imageInput: ImageInput = {
      getBase64() {
        return canvas.toDataURL();
      },
      getImageData() {
        return context.getImageData(0, 0, 640, 640);
      },
    };
    detectorService.detectar(imageInput);
  }

  for (const boundbox of detectorService.boundboxes) {
    desenhaBoundbox(boundbox, context);
  }

  if (detectorService.erroApi) {
    escreveMensagemDeErroCanvas(context, canvas);
  }
}

function desenhaBoundbox(
  boundbox: Boundbox,
  context: CanvasRenderingContext2D
) {
  const x = boundbox.x1;
  const y = boundbox.y1;
  const w = boundbox.x2 - boundbox.x1;
  const h = boundbox.y2 - boundbox.y1;

  const classe = boundbox.classe as keyof typeof caloriasPorGrama;
  const confianca = boundbox.confianca;
  const calorias = caloriasPorGrama[classe] || 0;

  context.strokeStyle = "green";
  context.lineWidth = 4;
  context.strokeRect(x, y, w, h);

  context.fillStyle = "green";
  context.font = "16px Arial";
  context.textAlign = "left";
  // Draw background rectangle with white fill and alpha 0.5
  context.fillStyle = "rgba(255, 255, 255, 0.5)";
  context.fillRect(
    x + 1,
    y + 1,
    context.measureText(`${classe}`).width + 8,
    20
  );
  context.fillRect(
    x + 1,
    y + 21,
    context.measureText(`${(confianca * 100).toFixed(0)}%`).width + 8,
    24
  );
  context.fillRect(
    x + 1,
    y + 45,
    context.measureText(`${calorias} cal/g`).width + 8,
    24
  );

  // Draw text
  context.fillStyle = "green";
  context.fillText(`${classe}`, x + 4, y + 16);
  context.fillText(`${(confianca * 100).toFixed(0)}%`, x + 4, y + 38);
  context.fillText(`${calorias} kcal`, x + 4, y + 62);
}

function escreveMensagemDeErroCanvas(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  const text = "Falha ao conectar com o servidor";
  const textWidth = context.measureText(text).width;
  const padding = 10;
  const rectWidth = textWidth + padding * 2;
  const rectHeight = 30;
  const rectX = (canvas.width - rectWidth) / 2;
  const rectY = (canvas.height - rectHeight) / 2;

  context.fillStyle = "white";
  context.strokeStyle = "green";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(rectX + 10, rectY);
  context.lineTo(rectX + rectWidth - 10, rectY);
  context.quadraticCurveTo(
    rectX + rectWidth,
    rectY,
    rectX + rectWidth,
    rectY + 10
  );
  context.lineTo(rectX + rectWidth, rectY + rectHeight - 10);
  context.quadraticCurveTo(
    rectX + rectWidth,
    rectY + rectHeight,
    rectX + rectWidth - 10,
    rectY + rectHeight
  );
  context.lineTo(rectX + 10, rectY + rectHeight);
  context.quadraticCurveTo(
    rectX,
    rectY + rectHeight,
    rectX,
    rectY + rectHeight - 10
  );
  context.lineTo(rectX, rectY + 10);
  context.quadraticCurveTo(rectX, rectY, rectX + 10, rectY);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "green";
  context.font = "20px Arial";
  context.textAlign = "center";
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 7);
}
