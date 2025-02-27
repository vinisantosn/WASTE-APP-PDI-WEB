import { createContext } from "react";
import { IAppContext } from "./types";

const AppContext = createContext<IAppContext>({
  navegarPara: () => {},
});

export default AppContext;
