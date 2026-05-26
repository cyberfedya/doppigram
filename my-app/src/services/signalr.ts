import * as signalR from '@microsoft/signalr';

const BASE = import.meta.env.VITE_API_URL ?? '';

let _connection: signalR.HubConnection | null = null;

export function getConnection(): signalR.HubConnection {
  if (!_connection) {
    _connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE}/hubs/chat`, {
        accessTokenFactory: () => localStorage.getItem('doppigram_token') ?? '',
        // Use LongPolling so the connection works through Netlify's HTTP proxy
        transport: signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return _connection;
}

export async function startConnection(): Promise<void> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
}

export async function stopConnection(): Promise<void> {
  if (_connection && _connection.state !== signalR.HubConnectionState.Disconnected) {
    await _connection.stop();
  }
}

/** Wait until the connection is Connected (handles Connecting/Reconnecting states) */
async function waitForConnected(timeoutMs = 8000): Promise<boolean> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Connected) return true;
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try { await conn.start(); return true; } catch { return false; }
  }
  // Connecting or Reconnecting — poll until Connected or timeout
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 150));
    const state = conn.state as signalR.HubConnectionState;
    if (state === signalR.HubConnectionState.Connected) return true;
    if (state === signalR.HubConnectionState.Disconnected) {
      try { await conn.start(); return true; } catch { return false; }
    }
  }
  return false;
}

export async function joinChat(chatId: string): Promise<void> {
  if (await waitForConnected()) {
    await getConnection().invoke('JoinChat', chatId);
  }
}

export async function leaveChat(chatId: string): Promise<void> {
  if (_connection?.state === signalR.HubConnectionState.Connected) {
    await _connection.invoke('LeaveChat', chatId);
  }
}

export async function joinUserGroup(userId: string): Promise<void> {
  if (await waitForConnected()) {
    await getConnection().invoke('JoinUserGroup', userId);
  }
}

export async function sendTyping(chatId: string, userId: string, username: string): Promise<void> {
  if (_connection?.state === signalR.HubConnectionState.Connected) {
    await _connection.invoke('SetTyping', chatId, userId, username);
  }
}

export async function clearTyping(chatId: string, userId: string): Promise<void> {
  if (_connection?.state === signalR.HubConnectionState.Connected) {
    await _connection.invoke('ClearTyping', chatId, userId);
  }
}

// Event subscriptions

type Handler = (...args: unknown[]) => void;

export function on(event: string, handler: Handler): () => void {
  const conn = getConnection();
  conn.on(event, handler);
  return () => conn.off(event, handler);
}
