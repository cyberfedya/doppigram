import * as signalR from '@microsoft/signalr';

// Runtime config: fetch /config.json to get direct CF tunnel URL for SignalR
// (bypasses Netlify proxy which kills long-running connections)
let _signalrUrl: string | null = null;
let _connection: signalR.HubConnection | null = null;

async function resolveSignalrUrl(): Promise<string> {
  if (_signalrUrl !== null) return _signalrUrl;
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) {
      const cfg = await res.json() as { signalrUrl?: string };
      if (cfg.signalrUrl?.startsWith('http')) {
        _signalrUrl = cfg.signalrUrl!;
        return _signalrUrl;
      }
    }
  } catch { /* ignore */ }
  // Fallback: relative URL (through Netlify proxy — works but slower)
  const fallback: string = import.meta.env.VITE_API_URL ?? '';
  _signalrUrl = fallback;
  return fallback;
}

function buildConnection(url: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${url}/hubs/chat`, {
      accessTokenFactory: () => localStorage.getItem('doppigram_token') ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

export function getConnection(): signalR.HubConnection {
  if (!_connection) {
    _connection = buildConnection(_signalrUrl ?? import.meta.env.VITE_API_URL ?? '');
  }
  return _connection;
}

export async function startConnection(): Promise<void> {
  const url = await resolveSignalrUrl();
  if (!_connection) {
    _connection = buildConnection(url);
  }
  if (_connection.state === signalR.HubConnectionState.Disconnected) {
    await _connection.start();
  }
}

export async function stopConnection(): Promise<void> {
  if (_connection && _connection.state !== signalR.HubConnectionState.Disconnected) {
    await _connection.stop();
  }
  _connection = null;
  _signalrUrl = null;
}

/** Wait until the connection is Connected (handles Connecting/Reconnecting states) */
async function waitForConnected(timeoutMs = 8000): Promise<boolean> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Connected) return true;
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try { await conn.start(); return true; } catch { return false; }
  }
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

type Handler = (...args: unknown[]) => void;

export function on(event: string, handler: Handler): () => void {
  const conn = getConnection();
  conn.on(event, handler);
  return () => conn.off(event, handler);
}
