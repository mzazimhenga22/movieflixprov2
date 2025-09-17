// src/services/firebaseAdmin.ts
/**
 * Robust firebase-admin shim + initializer for ESM/TypeScript.
 *
 * Behavior:
 *  - If a local initializer file exists at ./firebase it will be used (supports default or named export).
 *  - Otherwise this file will try to initialize firebase-admin:
 *      * If FCM_SERVICE_ACCOUNT_B64 is set, decodes and uses that JSON
 *      * Else if GOOGLE_APPLICATION_CREDENTIALS is set, uses applicationDefault()
 *      * Else if SERVICE_ACCOUNT_KEY_PATH env or ./serviceAccountKey.json exists, uses credential.cert(path)
 *      * Otherwise leaves admin uninitialized (apps: [])
 *
 * Exports:
 *  - getAdmin(): the firebase-admin module instance (typed)
 *  - getApp(): the initialized admin.app.App instance or null
 *  - getFirestore(): admin.firestore.Firestore or null
 *  - isInitialized(): boolean
 */

import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { fileURLToPath, pathToFileURL } from "url";
import { getErrorMessage } from "../utils/misc.js";

let app: admin.app.App | null = null;

/**
 * Try to dynamically import a local firebase initializer if it exists.
 */
async function tryUseLocalInitializer() {
  try {
    const mod = await import(pathToFileURL(path.resolve("./src/services/firebase.js")).href)
      .catch(() => null);

    if (!mod) return false;

    const candidate = (mod as any).default ?? mod;

    if (candidate?.apps && Array.isArray(candidate.apps)) {
      // Exported firebase-admin instance
      app = candidate.apps.length > 0 ? candidate.apps[0] : null;
      console.log("[firebaseAdmin] using local ./firebase initializer (exported admin)");
      return true;
    }

    if (candidate?.options && candidate?.name) {
      // Exported an already-initialized App
      app = candidate as admin.app.App;
      console.log("[firebaseAdmin] using local ./firebase initializer (exported app instance)");
      return true;
    }

    return false;
  } catch (e) {
    console.warn("[firebaseAdmin] tryUseLocalInitializer failed:", getErrorMessage(e));
    return false;
  }
}

/**
 * Try to initialize firebase-admin in this file.
 */
function tryInitializeHere() {
  try {
    if (admin.apps.length > 0) {
      app = admin.apps[0];
      console.log("[firebaseAdmin] firebase-admin already initialized (existing app found)");
      return true;
    }

    // 🔹 From Base64-encoded service account
    if (process.env.FCM_SERVICE_ACCOUNT_B64) {
      try {
        const jsonStr = Buffer.from(
          process.env.FCM_SERVICE_ACCOUNT_B64,
          "base64"
        ).toString("utf8");
        const serviceAccount = JSON.parse(jsonStr);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        app = admin.apps[0] ?? null;
        console.log("[firebaseAdmin] initialized firebase-admin from FCM_SERVICE_ACCOUNT_B64");
        return true;
      } catch (e) {
        console.warn("[firebaseAdmin] base64 service account init failed:", getErrorMessage(e));
      }
    }

    // 🔹 From GOOGLE_APPLICATION_CREDENTIALS (ADC)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        app = admin.apps[0] ?? null;
        console.log("[firebaseAdmin] initialized firebase-admin using applicationDefault()");
        return true;
      } catch (e) {
        console.warn("[firebaseAdmin] applicationDefault() init failed:", getErrorMessage(e));
      }
    }

    // 🔹 From local serviceAccountKey.json
    const keyPath =
      process.env.SERVICE_ACCOUNT_KEY_PATH ||
      path.join(process.cwd(), "serviceAccountKey.json");
    if (fs.existsSync(keyPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        app = admin.apps[0] ?? null;
        console.log(`[firebaseAdmin] initialized firebase-admin using service account at ${keyPath}`);
        return true;
      } catch (e) {
        console.warn("[firebaseAdmin] credential.cert init failed:", getErrorMessage(e));
      }
    }

    console.log("[firebaseAdmin] no service account found; firebase-admin left uninitialized (apps: [])");
    return false;
  } catch (e) {
    console.warn("[firebaseAdmin] tryInitializeHere unexpected error:", getErrorMessage(e));
    return false;
  }
}

// --- Boot sequence ---
await tryUseLocalInitializer();
if (!app) {
  tryInitializeHere();
}

// --- Exports ---
export function getAdmin(): typeof admin {
  return admin;
}

export function getApp(): admin.app.App | null {
  return app;
}

export function getFirestore(): admin.firestore.Firestore | null {
  try {
    if (!app) return null;
    return admin.firestore();
  } catch (e) {
    console.warn("[firebaseAdmin] getFirestore failed:", getErrorMessage(e));
    return null;
  }
}

export function isInitialized(): boolean {
  return !!(app && admin.apps && admin.apps.length > 0);
}
