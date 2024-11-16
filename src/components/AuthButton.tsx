"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import {Button, ButtonGroup} from "@nextui-org/button";


export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return <Button onClick={() => signOut()}>Logout</Button>;
  }
  return <Button onClick={() => signIn("google")}>Login with Google</Button>;
}