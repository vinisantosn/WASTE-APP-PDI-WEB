import { useContext } from "react";
import AppContext from "../contexts/app/context";

export default function useAppContext() {
  const context = useContext(AppContext);
  return context;
}
