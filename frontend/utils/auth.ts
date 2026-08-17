"use client";

import { useSyncExternalStore } from "react";

const AUTH_EVENT = "storypilot-auth-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_EVENT, callback);
  };
}

function getSnapshot() {
  return localStorage.getItem("token") !== null;
}

function getServerSnapshot() {
  return false;
}

export function useIsLoggedIn() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}