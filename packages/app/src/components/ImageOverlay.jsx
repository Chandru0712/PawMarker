import { useState, useEffect, useRef } from "react";
import "./Overlay.css";

// PREDEFINED CONTAINERS - Moved outside component so it's not recreated on every render
const CONTAINERS = [
  {
    id: 1,
    name: "Bengal Tiger",
    image: "/images/BengalTiger.PNG",
    countdownColor: "#ffc000",
    sound: "/sounds/bengal_tiger.mp3", // Add your sound file path
    key: "1",
  },
  {
    id: 2,
    name: "Elephant",
    image: "/images/Elephant.PNG",
    countdownColor: "#3b3838",
    sound: "/sounds/elephant.mp3",
    key: "2",
  },
  {
    id: 3,
    name: "Eurasian Otter",
    image: "/images/EurasianOtter.PNG",
    countdownColor: "#3b3838",
    sound: "/sounds/eurasian_otter.mp3",
    key: "3",
  },
  {
    id: 4,
    name: "Leopard",
    image: "/images/Leopard.PNG",
    countdownColor: "#ffc000",
    sound: "/sounds/leopard.mp3",
    key: "4",
  },
  {
    id: 5,
    name: "Rhinoceros",
    image: "/images/Rhinoceros.PNG",
    countdownColor: "#3b3838",
    sound: "/sounds/rhinoceros.mp3",
    key: "5",
  },
  {
    id: 6,
    name: "Sloth Bear",
    image: "/images/Slothbear.PNG",
    countdownColor: "#3b3838",
    sound: "/sounds/sloth_bear.mp3",
    key: "6",
  },
  {
    id: 7,
    name: "Spotted Deer",
    image: "/images/SpottedDeer.PNG",
    countdownColor: "#ffc000",
    sound: "/sounds/spotted_deer.mp3",
    key: "7",
  },
  {
    id: 8,
    name: "Striped Hyena",
    image: "/images/Stripedhyena.PNG",
    countdownColor: "#ffc000",
    sound: "/sounds/striped_hyena.mp3",
    key: "8",
  },
  {
    id: 9,
    name: "Wild Boar",
    image: "/images/Wildboar.PNG",
    countdownColor: "#3b3838",
    sound: "/sounds/wild_boar.mp3",
    key: "9",
  },
  {
    id: 10,
    name: "Wild Dog",
    image: "/images/WildDog.PNG",
    countdownColor: "#ffc000",
    sound: "/sounds/wild_dog.mp3",
    key: "0",
  },
];

// CONFIGURATION
const SOUND_VOLUME = 0.7; // Sound volume (0.0 to 1.0)
const COUNTDOWN_START = 8;
const COUNTDOWN_INTERVAL = 1000;
const GO_DISPLAY_DURATION = 5200; // milliseconds
const INACTIVITY_TIMEOUT_MINUTES = 5;
const INACTIVITY_TIMEOUT = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;

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

// Preload a container image
const preloadImage = (imageSrc) => {
  const img = new Image();
  img.src = imageSrc;
};

// Preload sound
const preloadSound = (soundPath) => {
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = soundPath;
  audio.load();
};

export default function ImageOverlay({
  initialContainerIndex = null,
  onReturnToWelcome,
}) {
  const [currentSlot, setCurrentSlot] = useState(0); // 0-9 slots
  const [scrollDirection, setScrollDirection] = useState("right"); // Track direction
  const [countdownValue, setCountdownValue] = useState(null);
  const containerRef = useRef(null);
  const prevSlotRef = useRef(0);
  const audioRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const countdownHideTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const currentContainer = CONTAINERS[currentSlot];

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      if (onReturnToWelcome) {
        onReturnToWelcome();
      }
    }, INACTIVITY_TIMEOUT);
  };

  const startCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    if (countdownHideTimerRef.current) {
      clearTimeout(countdownHideTimerRef.current);
      countdownHideTimerRef.current = null;
    }

    let nextValue = COUNTDOWN_START;
    setCountdownValue(nextValue);

    countdownTimerRef.current = setInterval(() => {
      nextValue -= 1;

      if (nextValue >= 0) {
        setCountdownValue(nextValue);
        return;
      }

      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      setCountdownValue("Go");

      countdownHideTimerRef.current = setTimeout(() => {
        setCountdownValue(null);
        countdownHideTimerRef.current = null;
      }, GO_DISPLAY_DURATION);
    }, COUNTDOWN_INTERVAL);
  };

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = SOUND_VOLUME;

    // Preload first sound
    if (CONTAINERS[0].sound) {
      preloadSound(CONTAINERS[0].sound);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (countdownHideTimerRef.current) {
        clearTimeout(countdownHideTimerRef.current);
        countdownHideTimerRef.current = null;
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, []);

  // Play sound when slot changes
  useEffect(() => {
    const playSlotSound = async () => {
      if (!audioRef.current) return;

      const currentContainer = CONTAINERS[currentSlot];

      // Stop current sound
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      // Load and play new sound
      if (currentContainer.sound) {
        try {
          audioRef.current.src = currentContainer.sound;
          audioRef.current.volume = SOUND_VOLUME;
          await audioRef.current.play();
        } catch (error) {
          console.log("Sound playback error:", error);
        }
      }
    };

    playSlotSound();
  }, [currentSlot]);

  // Fullscreen management for kiosk mode
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.log("Fullscreen not available or blocked:", err);
      }
    };

    // Auto-enter fullscreen on mount (for kiosk mode)
    enterFullscreen();

    return () => {};
  }, []);

  // Focus container + preload first container images
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
    // Preload the active container image immediately
    preloadImage(CONTAINERS[0].image);
    // Start inactivity timeout as soon as overlay is shown
    resetInactivityTimer();
  }, []);

  // Enforce Kiosk Mode: Disable Mouse & Restrict Keyboard
  useEffect(() => {
    // 1. Block Context Menu (Right Click)
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 2. Block All Mouse Clicks
    const blockMouse = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", blockMouse, true);
    document.addEventListener("mousedown", blockMouse, true);
    document.addEventListener("mouseup", blockMouse, true);
    document.addEventListener("dblclick", blockMouse, true);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", blockMouse, true);
      document.removeEventListener("mousedown", blockMouse, true);
      document.removeEventListener("mouseup", blockMouse, true);
      document.removeEventListener("dblclick", blockMouse, true);
    };
  }, []);

  // Keyboard navigation - ONLY numbers 0-9 allowed
  useEffect(() => {
    const handleKeyDown = (event) => {
      // STRICT MODE: Only allow 0-9. Block everything else (except system combos if OS intercepts them, but we try to block checks here)
      // Note: We cannot block Windows system keys like Ctrl+Alt+Del or Alt+Tab via JS, but we can block app shortcuts.
      const containerIndex = getContainerIndexFromKeyEvent(event);

      if (containerIndex !== null) {
        event.preventDefault(); // Good practice to prevent scrolling or other default actions if any
        startCountdown();
        resetInactivityTimer();

        // Only update if changing to a different slot
        // if (containerIndex === currentSlot) return;

        // Determine scroll direction
        if (containerIndex > prevSlotRef.current) {
          setScrollDirection("right");
        } else if (containerIndex < prevSlotRef.current) {
          setScrollDirection("left");
        }
        // If equal, do nothing or keep same direction

        setCurrentSlot(containerIndex);
        prevSlotRef.current = containerIndex;

        preloadImage(CONTAINERS[containerIndex].image);

        // Preload next container's sound
        const nextIndex = (containerIndex + 1) % CONTAINERS.length;
        if (CONTAINERS[nextIndex].sound) {
          preloadSound(CONTAINERS[nextIndex].sound);
        }
      } else {
        // Block all other keys (no screen change).
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "Escape") {
          if (window.electronAPI) {
            window.electronAPI.quitApp();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onReturnToWelcome]);

  useEffect(() => {
    if (initialContainerIndex === null) {
      return;
    }

    startCountdown();
    resetInactivityTimer();

    if (initialContainerIndex > prevSlotRef.current) {
      setScrollDirection("right");
    } else if (initialContainerIndex < prevSlotRef.current) {
      setScrollDirection("left");
    }

    setCurrentSlot(initialContainerIndex);
    prevSlotRef.current = initialContainerIndex;

    preloadImage(CONTAINERS[initialContainerIndex].image);

    const nextIndex = (initialContainerIndex + 1) % CONTAINERS.length;
    if (CONTAINERS[nextIndex].sound) {
      preloadSound(CONTAINERS[nextIndex].sound);
    }
  }, [initialContainerIndex]);

  return (
    <div className="overlay-root" ref={containerRef} tabIndex={0}>
      {/* Single photo mode: one image per selected container */}
      <div className={`layer content scroll-${scrollDirection}`}>
        <img
          src={CONTAINERS[currentSlot].image}
          alt={CONTAINERS[currentSlot].name}
        />
      </div>

      {countdownValue !== null && (
        <div
          className={`countdown-indicator ${countdownValue === "Go" ? "go" : ""}`}
          style={{ backgroundColor: currentContainer.countdownColor }}
          aria-live="polite"
        >
          {countdownValue === "Go" ? (
            <span className="countdown-go-text">Go</span>
          ) : (
            <>
              <span className="countdown-label">Wait</span>
              <span className="countdown-number">{countdownValue}</span>
            </>
          )}
        </div>
      )}

      <div className="sound-indicator"></div>
    </div>
  );
}
