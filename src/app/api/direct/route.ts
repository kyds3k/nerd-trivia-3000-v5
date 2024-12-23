import { NextResponse } from 'next/server';
import { getPusherInstance } from '../../../lib/pusher/server';

const pusherServer = getPusherInstance();


export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received body:", body);

    // Send data to Pusher
    await pusherServer.trigger(
      'directives',
      'evt::direct',
      {
        type: body.type,
        round: body.round,
        question: body.question,
        active: body.active,
        message: "MAKE IT SO!",
      }
    );

    return NextResponse.json(
      { message: "Data sent to Pusher successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST handler:", error);

    return NextResponse.json(
      { message: "Failed to send data to Pusher", error: error.message || error },
      { status: 500 }
    );
  }
}
