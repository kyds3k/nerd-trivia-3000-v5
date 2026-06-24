import Pusher from 'pusher-js';

const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  enabledTransports: ["ws", "wss"], // Ensure WebSocket connections
  disableStats: false             // Enable client event reporting
});

export default pusherClient;