import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isStandaloneNavigator = (window.navigator as any).standalone === true;
      const isAndroidPwa = document.referrer.includes("android-app://");
      return isStandaloneMedia || isStandaloneNavigator || isAndroidPwa;
    };

    const standalone = checkStandalone();
    setIsInstalled(standalone);

    // Detect if device is iOS (iPhone/iPad/iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !/lkx/.test(userAgent); // Exclude non-iOS matching edge cases
    setIsIOS(isIOSDevice);

    // For iOS, if it's not standalone, it's installable via Safari's Share menu
    if (isIOSDevice && !standalone) {
      setIsInstallable(true);
    }

    // Capture standard PWA install prompt for PC/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Monitor when the app is installed successfully
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] App successfully installed!");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (isIOS) {
      // Trigger the manual install prompt modal for iOS Safari users
      setShowIOSPrompt(true);
      return;
    }

    if (!deferredPrompt) {
      console.warn("[PWA] Install prompt event is not available yet.");
      return;
    }

    // Show the browser's native install prompt
    await deferredPrompt.prompt();

    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to installation: ${outcome}`);

    // Clean up prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    installApp,
    showIOSPrompt,
    setShowIOSPrompt,
  };
}
