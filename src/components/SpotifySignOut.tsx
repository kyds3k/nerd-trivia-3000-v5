"use client"

import { signOut } from "next-auth/react"
import { Button } from "@heroui/react"

export default function SpotifySignOut() {

  
  return <Button className="w-fit" onPress={() => signOut()}>Spotify Signout</Button>
}
