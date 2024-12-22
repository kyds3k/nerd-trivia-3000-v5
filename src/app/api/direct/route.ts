import { NextResponse } from 'next/server'
import { getPusherInstance } from '../../../lib/pusher/server';
const pusherServer = getPusherInstance();

export async function POST(req: Request, res: Response) {
  try {
      // Parse the JSON data from the incoming request
      const body = await req.json();

      // Use the parsed data
      await pusherServer.trigger(
          'directives',
          "evt::direct",
          {
              type: body.type,
              round: body.round,
              question: body.question,
              active: body.active,
              message: "MAKE IT SO!"
          }
      );

      return NextResponse.json({ message: `Sockets tested. Data received: ${JSON.stringify(body)}` }, { status: 200 });
  } catch (error) {
      console.error(error);
      return NextResponse.json({ message: "Failed to test sockets", error: error }, { status: 500 });
  }
}
