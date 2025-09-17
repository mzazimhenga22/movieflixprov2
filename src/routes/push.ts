/**
 * /sendPush route module
 */
import { Application, Request, Response } from "express";
import { requirePushApiKey } from "../middleware/auth.js";
import { getAdmin, isInitialized } from "../services/firebaseAdmin.js";
import { coerceExtraDataToStrings, getErrorMessage } from "../utils/misc.js";

export function registerPushRoutes(app: Application) {
  app.post("/sendPush", requirePushApiKey, async (req: Request, res: Response) => {
    const admin: any = getAdmin();
    if (!isInitialized()) {
      return res.status(500).json({ ok: false, error: "FCM not initialized on server" });
    }

    try {
      const {
        fcmToken,
        title = "",
        body = "",
        extraData = {},
        notification = true,
        topic,
        dryRun = false,
      } = req.body as {
        fcmToken?: string;
        title?: string;
        body?: string;
        extraData?: any;
        notification?: boolean;
        topic?: string;
        dryRun?: boolean;
      };

      if (!fcmToken && !topic) {
        return res.status(400).json({ ok: false, error: "fcmToken or topic is required" });
      }

      const data = coerceExtraDataToStrings(extraData);
      const isIncomingCall = (data["type"] || "").toString() === "incoming_call";

      const baseMessage: any = {
        data,
        android: { priority: "high" },
      };

      if (topic) baseMessage.topic = String(topic);
      else baseMessage.token = String(fcmToken);

      if (isIncomingCall) {
        baseMessage.apns = {
          headers: { "apns-push-type": "voip", "apns-priority": "10" },
          payload: { aps: { "content-available": 1 } },
        };
      } else {
        if (notification) baseMessage.notification = { title: String(title), body: String(body) };
        baseMessage.apns = { payload: { aps: { "content-available": 1 } } };
      }

      const response = await admin.messaging().send(baseMessage, !!dryRun);
      return res.json({ ok: true, messageId: response });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      console.error("[sendPush] error:", msg, (err as any)?.stack);
      return res.status(500).json({ ok: false, error: msg });
    }
  });
}
