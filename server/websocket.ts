import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import type { Express } from 'express';
import { db } from '@db';
import { messages, notifications, type User, users } from '@db/schema';
import { eq } from 'drizzle-orm';

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive: boolean;
}

interface MessagePayload {
  type: 'message' | 'typing' | 'read';
  content?: string;
  receiverId?: number;
  messageId?: number;
}

export function setupWebSocket(server: Server, app: Express) {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<number, ExtendedWebSocket>();

  // Handle WebSocket upgrade
  server.on('upgrade', (request, socket, head) => {
    if (request.headers['sec-websocket-protocol'] === 'vite-hmr') {
      return;
    }

    // @ts-ignore - session typing
    if (!request.session?.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      // @ts-ignore - session typing
      const userId = request.session.userId;
      wss.emit('connection', ws, userId);
    });
  });

  wss.on('connection', (ws: ExtendedWebSocket, userId: number) => {
    ws.userId = userId;
    ws.isAlive = true;
    clients.set(userId, ws);

    // Send initial unread count
    sendUnreadCount(ws, userId);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const payload: MessagePayload = JSON.parse(data.toString());

        switch (payload.type) {
          case 'message':
            if (payload.receiverId && payload.content) {
              // Store message in database
              const [newMessage] = await db.insert(messages).values({
                senderId: userId,
                receiverId: payload.receiverId,
                content: payload.content,
                read: false,
              }).returning();

              // Create notification
              await db.insert(notifications).values({
                userId: payload.receiverId,
                messageId: newMessage.id,
                type: 'message',
                content: `New message from ${(await getUser(userId))?.name}`,
              });

              // Send to receiver if online
              const receiverWs = clients.get(payload.receiverId);
              if (receiverWs?.readyState === WebSocket.OPEN) {
                receiverWs.send(JSON.stringify({
                  type: 'new_message',
                  message: newMessage,
                  sender: await getUser(userId)
                }));
              }

              // Confirm to sender
              ws.send(JSON.stringify({
                type: 'message_sent',
                message: newMessage
              }));
            }
            break;

          case 'typing':
            if (payload.receiverId) {
              const receiverWs = clients.get(payload.receiverId);
              if (receiverWs?.readyState === WebSocket.OPEN) {
                receiverWs.send(JSON.stringify({
                  type: 'typing',
                  senderId: userId
                }));
              }
            }
            break;

          case 'read':
            if (payload.messageId) {
              // Mark message as read
              await db.update(messages)
                .set({ read: true })
                .where(eq(messages.id, payload.messageId));

              // Notify sender if online
              const message = await db.query.messages.findFirst({
                where: eq(messages.id, payload.messageId)
              });

              if (message) {
                const senderWs = clients.get(message.senderId);
                if (senderWs?.readyState === WebSocket.OPEN) {
                  senderWs.send(JSON.stringify({
                    type: 'message_read',
                    messageId: payload.messageId
                  }));
                }
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(userId);
    });
  });

  // Heartbeat to keep connections alive and clean up dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (!ws.isAlive) {
        clients.delete(ws.userId!);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  async function sendUnreadCount(ws: WebSocket, userId: number) {
    const unreadMessages = await db.query.messages.findMany({
      where: eq(messages.receiverId, userId),
      columns: {
        id: true,
        read: true
      }
    });

    ws.send(JSON.stringify({
      type: 'unread_count',
      count: unreadMessages.filter(m => !m.read).length
    }));
  }

  async function getUser(userId: number): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user;
  }

  // Expose methods to send notifications from other parts of the application
  app.set('sendNotification', async (userId: number, notification: { type: string, content: string }) => {
    const ws = clients.get(userId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'notification',
        ...notification
      }));
    }
  });
}