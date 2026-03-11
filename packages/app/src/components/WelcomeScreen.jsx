import { useEffect } from "react";
import "./WelcomeScreen.css";

export default function WelcomeScreen({ onStart }) {
  useEffect(() => {
    const getContainerIndexFromKeyEvent = (event) => {
      if (/^[0-9]$/.test(event.key)) {
        return event.key === "0" ? 9 : parseInt(event.key, 10) - 1;
      }

      if (/^Numpad[0-9]$/.test(event.code)) {
        const digit = event.code.replace("Numpad", "");
        return digit === "0" ? 9 : parseInt(digit, 10) - 1;
      }

      return null;
    };

    const handleStart = (event) => {
      const containerIndex = getContainerIndexFromKeyEvent(event);

      if (containerIndex === null) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      onStart(containerIndex);
    };

    window.addEventListener("keydown", handleStart);

    return () => {
      window.removeEventListener("keydown", handleStart);
    };
  }, [onStart]);

  return (
    <section className="welcome-screen" aria-label="Welcome screen">
      <img
        className="welcome-image"
        src="/images/WelcomeScreen.webp"
        alt="Welcome"
      />
      <p className="welcome-hint">Press number Any Paw Mark to start</p>
    </section>
  );
}
