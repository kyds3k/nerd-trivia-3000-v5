"use client"

import { signIn } from "next-auth/react"
import { Button } from "@heroui/react"

export default function SpotifySignIn() {
  return <Button className="w-fit" onPress={() => signIn("spotify")}>Spotify Signin</Button>
}
