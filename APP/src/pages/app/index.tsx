import { FC, useState } from "react";
import VerificadorDePermissaoDeCamera from "./CameraPermissionChecker";
import "./style.css";
import Detector from "./detector";

const AppPage: FC = () => {
  const [pronto, setPronto] = useState(false);

  return (
    <div className="app-page-container">
      {!pronto && (
        <div className="modal">
          <VerificadorDePermissaoDeCamera
            onPermiteCamera={() => setPronto(true)}
          />
        </div>
      )}

      {pronto && <Detector />}
    </div>
  );
};

export default AppPage;