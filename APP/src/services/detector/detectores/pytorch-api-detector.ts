import axios, { AxiosResponse } from "axios";
import { ImageInput, Boundbox, Detector } from "../types";

export default class PytorchApiDetector implements Detector {
  constructor(private apiUrl: string) {}

  public async detectar(
    imageInput: ImageInput,
    confianca: number
  ): Promise<Boundbox[]> {
    const requestData: RequestData = {
      base64_img: imageInput.getBase64(),
      confianca,
    };

    const response = await axios.post<
      unknown,
      AxiosResponse<ResponseData>,
      RequestData
    >(`${this.apiUrl}/detect`, requestData);
    return response.data.data.boundboxes;
  }
}

interface RequestData {
  base64_img: string;
  confianca: number;
}

interface ResponseData {
  data: {
    boundboxes: Boundbox[];
  };
  metadata: {
    img_shape: number[];
  };
}
