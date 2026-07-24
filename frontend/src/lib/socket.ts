import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './apiBaseUrl';

let socket: Socket | null = null;

export const getSocket = (accessToken: string): Socket => {
  if (!socket || !socket.connected) {
    const baseUrl = getApiBaseUrl().replace(/\/api$/, "") || "/";
    socket = io(baseUrl, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
