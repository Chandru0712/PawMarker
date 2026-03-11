import { useState } from "react";
import ImageOverlay from "./components/ImageOverlay";
import WelcomeScreen from "./components/WelcomeScreen";
import "./App.css";

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [initialContainerIndex, setInitialContainerIndex] = useState(null);

  const handleStart = (containerIndex) => {
    setInitialContainerIndex(containerIndex);
    setHasStarted(true);
  };

  const handleReturnToWelcome = () => {
    setHasStarted(false);
    setInitialContainerIndex(null);
  };

  if (!hasStarted) {
    return <WelcomeScreen onStart={handleStart} />;
  }

  return (
    <ImageOverlay
      initialContainerIndex={initialContainerIndex}
      onReturnToWelcome={handleReturnToWelcome}
    />
  );
}
