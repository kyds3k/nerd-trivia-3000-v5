"use client";

import { useEffect } from "react";
import AuthButton from "../components/AuthButton";
import { useSession } from "next-auth/react";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <div className="p-10">
      <h1 className="text-2xl pb-6">Welcome to Nerd Trivia 3000!</h1>
      <AuthButton />
      {session && (
        <div className="mt-6">
          <p>
            <Button as={Link} href="/dashboard">Admin Dashboard</Button>
          </p>
        </div>
      )}
    </div>
  );
}
