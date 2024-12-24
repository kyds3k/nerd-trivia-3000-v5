import { NextResponse } from "next/server";
import { getPusherInstance } from "../../../lib/pusher/server";

const pusherServer = getPusherInstance();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await pusherServer.trigger("notifications", "evt::notify", {
      type: body.type,
      message: body.message,
      team: body.team
    });

    return NextResponse.json(
      { message: `Sockets tested. Data received: ${JSON.stringify(body)}` },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to test sockets", error: error },
      { status: 500 }
    );
  }
}
