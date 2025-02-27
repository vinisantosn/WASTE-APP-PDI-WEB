import { FC, useEffect, useState } from "react";

interface VerificadorDePermissaoDeCameraProps {
  onPermiteCamera: () => void;
}

const VerificadorDePermissaoDeCamera: FC<
  VerificadorDePermissaoDeCameraProps
> = ({ onPermiteCamera }) => {
  const [temPermissao, setTemPermissao] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  const requestCameraPermission = async () => {
    setCarregando(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setTemPermissao(true);
    } catch (err) {
      setErro(true);
      console.error("Error accessing camera:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (temPermissao) {
      setTimeout(() => {
        onPermiteCamera();
      }, 1000);
    }
  }, [temPermissao, onPermiteCamera]);

  return (
    <div className="verificador-permissao-container">
      
      <div className="large-space"></div>
      
      <div className="space"></div>
      {temPermissao && (
        <p className="primary-text" style={{ textAlign: "center" }}>
          Abrindo aplicação...
        </p>
      )}

      {!temPermissao && (
        <button
          onClick={requestCameraPermission}
          disabled={carregando || !!erro}
        >
          {carregando && <progress className="circle small"></progress>}
          Permitir Acesso à Câmera do Dispositivo
        </button>
      )}

      {erro && (
        <p className="error-text" style={{ textAlign: "center" }}>
          Por favor, permita o acesso à câmera para continuar.
        </p>
      )}
    </div>
  );
};

export default VerificadorDePermissaoDeCamera;
