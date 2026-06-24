import { NextResponse } from 'next/server';
import { getPusherInstance } from '../../../lib/pusher/server';
import { requireAdmin, requireUser } from '@/lib/serverAuth';

const pusherServer = getPusherInstance();


export async function POST(req: Request) {
  try {
    // Parse the request body first so we can gate by directive type.
    const body = await req.json();

    if (body.type === "request_location") {
      // A reconnecting player asking the presenter to re-announce its location.
      // Harmless (it only triggers a re-broadcast of where the game already is),
      // so any logged-in user may send it — not just admins.
      const user = await requireUser(req);
      if (!user) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    } else {
      // Every other directive actually drives the live broadcast — admin only.
      const admin = await requireAdmin(req);
      if (!admin) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    // Send data to Pusher
    await pusherServer.trigger(
      'directives',
      'evt::direct',
      {
        type: body.type,
        round: body.round,
        question: body.question,
        active: body.active,
        tiedTeamIds: body.tiedTeamIds, // Add tiedTeamIds to the payload
        message: "MAKE IT SO!",
      }
    );

    return NextResponse.json(
      { message: "Data sent to Pusher successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST handler:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { message: "Failed to send data to Pusher", error: errorMessage },
      { status: 500 }
    );
  }
}
