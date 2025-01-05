import { NextResponse } from "next/server";
import Pocketbase from "pocketbase";

export async function POST() {

  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPass = process.env.POCKETBASE_ADMIN_PW;
  const pb = new Pocketbase("https://nerd-trivia-3k.pockethost.io");

  
  console.log("Admin Email:", adminEmail); // Should print the email
  console.log("Admin Password:", adminPass); // Should print the password (remove this in production)

  if (!adminEmail || !adminPass) {
    return NextResponse.json({ error: "Environment variables are not set" }, { status: 500 });
  }

  try {
    pb.autoCancellation(false);
    const authData = await pb.collection("superusers").authWithPassword(adminEmail, adminPass, { cache: "no-store" });
    return NextResponse.json(authData, { status: 200 });
   
  } catch (error) {
    console.error("Authentication failed:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}