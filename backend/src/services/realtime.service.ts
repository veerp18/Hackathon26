import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data';
import { config } from '../config';
import WebSocket from 'ws';

// AWS IoT Core client for real-time messaging
const iotClient = new IoTDataPlaneClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId!,
    secretAccessKey: config.aws.secretAccessKey!,
  },
  endpoint: `https://${config.iot.endpoint}`,
});

export class RealtimeService {
  private wsServer: WebSocket.Server | null = null;

  // Initialize WebSocket server for client connections
  initializeWebSocketServer(server: any) {
    this.wsServer = new WebSocket.Server({ server });

    this.wsServer.on('connection', (ws: WebSocket, req) => {
      console.log('Client connected to WebSocket');

      ws.on('message', (message: string) => {
        console.log('Received:', message);
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  // Broadcast report changes to all connected clients via AWS IoT
  async broadcastReportChange(reportId: string, change: any) {
    const topic = `reports/${reportId}/updates`;
    const payload = JSON.stringify({
      reportId,
      timestamp: new Date().toISOString(),
      change,
    });

    try {
      await iotClient.send(
        new PublishCommand({
          topic,
          payload: Buffer.from(payload),
          qos: 1,
        })
      );

      // Also broadcast to local WebSocket clients
      this.broadcastToLocalClients(reportId, change);

      console.log(`Broadcasted change to topic: ${topic}`);
    } catch (error) {
      console.error('Failed to broadcast report change:', error);
      throw error;
    }
  }

  // Broadcast to local WebSocket clients
  private broadcastToLocalClients(reportId: string, change: any) {
    if (!this.wsServer) return;

    const message = JSON.stringify({
      type: 'report_update',
      reportId,
      change,
      timestamp: new Date().toISOString(),
    });

    this.wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Subscribe to report updates (for server-side listeners)
  async subscribeToReport(reportId: string, callback: (change: any) => void) {
    // In production, this would use AWS IoT MQTT subscriptions
    // For now, we'll use local WebSocket connections
    console.log(`Subscribed to report: ${reportId}`);
  }
}

export const realtimeService = new RealtimeService();
