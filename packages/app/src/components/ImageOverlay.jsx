import { useState, useEffect, useRef, useMemo } from "react";
import "./Overlay.css";

// PREDEFINED CONTAINERS - Moved outside component so it's not recreated on every render
const CONTAINERS = [
  {
    id: 1,
    name: "Bengal Tiger",
    folder: "/images/Bengal_Tiger",
    sound: "/sounds/bengal_tiger.mp3", // Add your sound file path
    key: "1",
  },
  {
    id: 2,
    name: "Elephant",
    folder: "/images/Elephant",
    sound: "/sounds/elephant.mp3",
    key: "2",
  },
  {
    id: 3,
    name: "Eurasian Otter",
    folder: "/images/EurasianOtter",
    sound: "/sounds/eurasian_otter.mp3",
    key: "3",
  },
  {
    id: 4,
    name: "Leopard",
    folder: "/images/Leopard",
    sound: "/sounds/leopard.mp3",
    key: "4",
  },
  {
    id: 5,
    name: "Rhinoceros",
    folder: "/images/Rhinoceros",
    sound: "/sounds/rhinoceros.mp3",
    key: "5",
  },
  {
    id: 6,
    name: "Sloth Bear",
    folder: "/images/Slothbear",
    sound: "/sounds/sloth_bear.mp3",
    key: "6",
  },
  {
    id: 7,
    name: "Spotted Deer",
    folder: "/images/SpottedDeer",
    sound: "/sounds/spotted_deer.mp3",
    key: "7",
  },
  {
    id: 8,
    name: "Striped Hyena",
    folder: "/images/Stripedhyena",
    sound: "/sounds/striped_hyena.mp3",
    key: "8",
  },
  {
    id: 9,
    name: "Wild Boar",
    folder: "/images/Wildboar",
    sound: "/sounds/wild_boar.mp3",
    key: "9",
  },
  {
    id: 10,
    name: "Wild Dog",
    folder: "/images/WildDog",
    sound: "/sounds/wild_dog.mp3",
    key: "0",
  },
];

// CONFIGURATION
const AUTO_ROTATE_DELAY = 5000; // 5 seconds
const TOTAL_OBJECT_IMAGES = 3; // Number of rotating images per container
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

// Preload images efficiently - plain function, not hook
const preloadImagesBatch = (containerIndex) => {
  const container = CONTAINERS[containerIndex];
  const imagesToPreload = [
    `${container.folder}/T_Content.webp`,
    `${container.folder}/1st.webp`,
    `${container.folder}/2nd.webp`,
    `${container.folder}/3rd.webp`,
    `${container.folder}/T_Frame.webp`,
  ];

  imagesToPreload.forEach((imageSrc) => {
    const img = new Image();
    img.src = imageSrc;
  });
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
  const [currentImageInSlot, setCurrentImageInSlot] = useState(0); // 0-2 images per slot
  const [scrollDirection, setScrollDirection] = useState("right"); // Track direction
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [countdownValue, setCountdownValue] = useState(null);
  const containerRef = useRef(null);
  const prevSlotRef = useRef(0);
  const audioRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const countdownHideTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);

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
      if (!audioRef.current || isMuted) return;

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
  }, [currentSlot, isMuted]);

  // Fullscreen management for kiosk mode
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.log("Fullscreen not available or blocked:", err);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // Auto-enter fullscreen on mount (for kiosk mode)
    enterFullscreen();

    // Listen for fullscreen changes
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Focus container + preload first container images
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
    // Preload first container images immediately
    preloadImagesBatch(0);
    // Start inactivity timeout as soon as overlay is shown
    resetInactivityTimer();
  }, []);

  // Auto-rotate ONLY object images (1st, 2nd, 3rd) with configurable delay
  // Content and Frame images remain STATIC for each container
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageInSlot((prev) => (prev + 1) % TOTAL_OBJECT_IMAGES);
    }, AUTO_ROTATE_DELAY);

    return () => clearInterval(timer);
  }, []);

  // Memoize object images to avoid recalculation on every render
  const currentObjectImages = useMemo(() => {
    const basePath = CONTAINERS[currentSlot].folder;
    return [
      `${basePath}/1st.webp`,
      `${basePath}/2nd.webp`,
      `${basePath}/3rd.webp`,
    ];
  }, [currentSlot]);

  // Reset object image index whenever the slot changes
  useEffect(() => {
    setCurrentImageInSlot(0);
  }, [currentSlot]);

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
        preloadImagesBatch(containerIndex);

        // Preload next container's sound
        const nextIndex = (containerIndex + 1) % CONTAINERS.length;
        if (CONTAINERS[nextIndex].sound) {
          preloadSound(CONTAINERS[nextIndex].sound);
        }
      } else {
        // Block all other keys
        event.preventDefault();
        event.stopPropagation();
        if (onReturnToWelcome) {
          onReturnToWelcome();
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
    preloadImagesBatch(initialContainerIndex);

    const nextIndex = (initialContainerIndex + 1) % CONTAINERS.length;
    if (CONTAINERS[nextIndex].sound) {
      preloadSound(CONTAINERS[nextIndex].sound);
    }
  }, [initialContainerIndex]);

  return (
    <div className="overlay-root" ref={containerRef} tabIndex={0}>
      {/* STATIC CONTENT IMAGE - Changes per container but doesn't rotate */}
      <div className={`layer content scroll-${scrollDirection}`}>
        <img
          src={`${CONTAINERS[currentSlot].folder}/T_Content.webp`}
          alt={`${CONTAINERS[currentSlot].name} Content`}
        />
      </div>

      {/* AUTO-ROTATING OBJECT IMAGES - Cycle through 1st, 2nd, 3rd */}
      <div className="layer objects">
        {currentObjectImages.map((imageSrc, index) => (
          <img
            key={`obj-${index}`}
            src={imageSrc}
            alt={`${CONTAINERS[currentSlot].name} Object ${index + 1}`}
            className={`object-image ${index === currentImageInSlot ? "active" : ""}`}
          />
        ))}
      </div>

      {/* STATIC FRAME IMAGE - Changes per container but doesn't rotate */}
      <div className={`layer frame scroll-${scrollDirection}`}>
        <img
          src={`${CONTAINERS[currentSlot].folder}/T_Frame.webp`}
          alt={`${CONTAINERS[currentSlot].name} Frame`}
        />
      </div>

      {countdownValue !== null && (
        <div
          className={`countdown-indicator ${countdownValue === "Go" ? "go" : ""}`}
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
