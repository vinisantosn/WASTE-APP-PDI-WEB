import "./App.css";
import AppContextProvider from "./contexts/app/provider";
import AppPage from "./pages/app";
function App() {
  return <AppContextProvider appPage={<AppPage />} />;
}

export default App;
