// Notification system for macOS + Telegram

import { execFileSync } from "child_process";
import { getTelegramConfig } from "./config.js";
import type { ProcessedJudgment } from "../types/index.js";

export interface NotificationOptions {
  title?: string;
  subtitle?: string;
  sound?: boolean;
}

export interface TelegramMessageOptions {
  silent?: boolean;
  disableWebPreview?: boolean;
}

/**
 * Send a native macOS notification
 */
function escapeAppleScriptString(s: string): string {
  // AppleScript string literal uses double quotes; escape backslashes + quotes.
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function sendNotification(
  message: string,
  options: NotificationOptions = {},
): boolean {
  const { title = "ris-cli", subtitle, sound = true } = options;

  const subtitleArg = subtitle
    ? `subtitle "${escapeAppleScriptString(subtitle)}"`
    : "";
  const soundArg = sound ? 'sound name "default"' : "";

  // AppleScript syntax:
  // display notification "msg" with title "title" subtitle "sub" sound name "default"
  const script = `display notification "${escapeAppleScriptString(message)}" with title "${escapeAppleScriptString(title)}" ${subtitleArg} ${soundArg}`;

  try {
    // Avoid shell quoting issues by calling osascript directly.
    execFileSync("osascript", ["-e", script], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch (error) {
    console.warn("Failed to send notification:", error);
    return false;
  }
}

export async function sendTelegramNotification(
  text: string,
  options: TelegramMessageOptions = {},
): Promise<boolean> {
  const cfg = getTelegramConfig();
  if (!cfg) return false;

  const { silent = false, disableWebPreview = true } = options;

  const body: Record<string, any> = {
    chat_id: cfg.chatId,
    text,
    disable_notification: silent,
    disable_web_page_preview: disableWebPreview,
  };

  if (cfg.topicId) body.message_thread_id = cfg.topicId;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(
        `Failed to send Telegram notification: HTTP ${res.status} ${res.statusText} ${errText}`,
      );
      return false;
    }

    const json = (await res.json().catch(() => null)) as any;
    if (!json?.ok) {
      console.warn("Failed to send Telegram notification:", json);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Failed to send Telegram notification:", error);
    return false;
  }
}

/**
 * Send notification about new judgments
 */
export function notifyNewJudgments(count: number, query?: string): void {
  const message =
    count === 1
      ? `1 neues Urteil gefunden${query ? ` für "${query}"` : ""}`
      : `${count} neue Urteile gefunden${query ? ` für "${query}"` : ""}`;

  // If Telegram isn't configured, fall back to macOS.
  void (async () => {
    const sent = await sendTelegramNotification(`🧾 RIS CLI: ${message}`, {
      silent: count === 0,
    });
    if (sent) return;

    sendNotification(message, {
      title: "ris-cli",
      subtitle:
        count > 0
          ? `${count} neue(r) Eintrag/Einträge`
          : "Keine neuen Einträge",
      sound: count > 0,
    });
  })();
}

export function notifyJudgmentList(
  judgments: ProcessedJudgment[],
  hours: number,
): void {
  const count = judgments.length;
  const header = `🧾 RIS CLI: ${count} neue Urteile (letzte ${hours}h)`;

  // Telegram messages have a 4096 char limit. Keep it comfortably below.
  const lines: string[] = [header, ""];

  for (const j of judgments) {
    const fileName = j.filePath.split("/").pop() || j.filePath;
    lines.push(`• ${fileName}`);
    lines.push(`  Query: "${j.query}"`);
    lines.push(`  ${j.url}`);
    lines.push("");

    if (lines.join("\n").length > 3500) {
      lines.push("… (gekürzt)");
      break;
    }
  }

  const text = lines.join("\n").trim();

  void (async () => {
    const sent = await sendTelegramNotification(text, { silent: false });
    if (sent) return;

    // macOS fallback: don't spam with a wall of text.
    notifyNewJudgments(count);
  })();
}

/**
 * Send sync completion notification
 */
export function notifySyncComplete(synced: number, errors: number = 0): void {
  const title = "ris-cli Sync";

  // Telegram if configured, otherwise macOS.
  void (async () => {
    const cfg = getTelegramConfig();
    if (cfg) {
      const text =
        errors === 0
          ? `✅ ${synced} Urteil(e) synchronisiert.`
          : `⚠️ ${synced} Urteile synchronisiert, ${errors} Fehler.`;

      await sendTelegramNotification(text, { silent: false });
      return;
    }

    if (synced === 0 && errors === 0) {
      sendNotification(
        "Keine neuen Urteile seit der letzten Synchronisation.",
        {
          title,
          subtitle: "Abgeschlossen",
          sound: false,
        },
      );
    } else if (errors === 0) {
      sendNotification(`${synced} Urteil(e) erfolgreich synchronisiert.`, {
        title,
        subtitle: "Abgeschlossen",
        sound: true,
      });
    } else {
      sendNotification(`${synced} Urteile synchronisiert, ${errors} Fehler.`, {
        title,
        subtitle: "Mit Fehlern abgeschlossen",
        sound: true,
      });
    }
  })();
}

/**
 * Console fallback for non-macOS systems
 */
export function logToConsole(
  message: string,
  level: "info" | "warn" | "error" = "info",
): void {
  const prefix = {
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
  }[level];

  console.log(`${prefix} ${message}`);
}
