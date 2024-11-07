"use client";

import AuthButton from "../components/AuthButton";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div>
      <h1>Welcome to Nerd Trivia 3000!</h1>
      <AuthButton />
      {session && (
        <div>
          <p>
            Access the admin dashboard <Link href="/dashboard">here</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
