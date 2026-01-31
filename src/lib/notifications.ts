// Notification system for macOS

import { execFileSync } from 'child_process';

export interface NotificationOptions {
  title?: string;
  subtitle?: string;
  sound?: boolean;
}

/**
 * Send a native macOS notification
 */
function escapeAppleScriptString(s: string): string {
  // AppleScript string literal uses double quotes; escape backslashes + quotes.
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function sendNotification(message: string, options: NotificationOptions = {}): boolean {
  const { title = 'urteil-watch', subtitle, sound = true } = options;

  const subtitleArg = subtitle ? `subtitle "${escapeAppleScriptString(subtitle)}"` : '';
  const soundArg = sound ? 'sound name "default"' : '';

  // AppleScript syntax:
  // display notification "msg" with title "title" subtitle "sub" sound name "default"
  const script = `display notification "${escapeAppleScriptString(message)}" with title "${escapeAppleScriptString(title)}" ${subtitleArg} ${soundArg}`;

  try {
    // Avoid shell quoting issues by calling osascript directly.
    execFileSync('osascript', ['-e', script], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return true;
  } catch (error) {
    console.warn('Failed to send notification:', error);
    return false;
  }
}

/**
 * Send notification about new judgments
 */
export function notifyNewJudgments(count: number, query?: string): void {
  const message = count === 1 
    ? `1 neues Urteil gefunden${query ? ` für "${query}"` : ''}`
    : `${count} neue Urteile gefunden${query ? ` für "${query}"` : ''}`;

  sendNotification(message, {
    title: 'urteil-watch',
    subtitle: count > 0 ? `${count} neue(r) Eintrag/Einträge` : 'Keine neuen Einträge',
    sound: count > 0,
  });
}

/**
 * Send sync completion notification
 */
export function notifySyncComplete(synced: number, errors: number = 0): void {
  if (synced === 0 && errors === 0) {
    sendNotification('Keine neuen Urteile seit der letzten Synchronisation.', {
      title: 'urteil-watch Sync',
      subtitle: 'Abgeschlossen',
      sound: false,
    });
  } else if (errors === 0) {
    sendNotification(`${synced} Urteil(e) erfolgreich synchronisiert.`, {
      title: 'urteil-watch Sync',
      subtitle: 'Abgeschlossen',
      sound: true,
    });
  } else {
    sendNotification(`${synced} Urteile synchronisiert, ${errors} Fehler.`, {
      title: 'urteil-watch Sync',
      subtitle: 'Mit Fehlern abgeschlossen',
      sound: true,
    });
  }
}

/**
 * Console fallback for non-macOS systems
 */
export function logToConsole(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const prefix = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  }[level];

  console.log(`${prefix} ${message}`);
}
