import * as signalR from '@microsoft/signalr';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

let _connection: signalR.HubConnection | null = null;

export function getConnection(): signalR.HubConnection {
  if (!_connection) {
    _connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE}/hubs/chat`, {
        accessTokenFactory: () => localStorage.getItem('doppigram_token') ?? '',
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

export async function joinChat(chatId: string): Promise<void> {
  await startConnection();
  await getConnection().invoke('JoinChat', chatId);
}

export async function leaveChat(chatId: string): Promise<void> {
  if (_connection?.state === signalR.HubConnectionState.Connected) {
    await _connection.invoke('LeaveChat', chatId);
  }
}

export async function joinUserGroup(userId: string): Promise<void> {
  await startConnection();
  await getConnection().invoke('JoinUserGroup', userId);
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
