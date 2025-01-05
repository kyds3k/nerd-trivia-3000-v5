"use client"

import { signOut } from "next-auth/react"
import { Button } from "@nextui-org/react"

export default function SpotifySignOut() {

  
  return <Button className="w-fit" onPress={() => signOut()}>Spotify Signout</Button>
}
