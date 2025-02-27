export enum Pagina {
  APP = "APP"
}

export interface IAppContext {
  navegarPara: (pagina: Pagina) => void;
}
