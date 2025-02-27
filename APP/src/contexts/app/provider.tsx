import { FC, ReactNode, useState } from "react";
import { Pagina } from "./types";
import AppContext from "./context";

interface AppContextProviderProps {
  appPage: ReactNode;
}

const AppContextProvider: FC<AppContextProviderProps> = ({
  appPage,
}) => {
  const [paginaAtual, navegarPara] = useState(Pagina.APP);

  return (
    <AppContext.Provider value={{ navegarPara }}>      
      {paginaAtual === Pagina.APP && appPage}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
