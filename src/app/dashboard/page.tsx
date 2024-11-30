"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import pb from "../../lib/pocketbase";
import { Edition } from "../../types/pocketbase";
import { Button } from "@nextui-org/button";
import { Progress } from "@nextui-org/react";
import { auth } from "../../../auth";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);



  useEffect(() => {
    console.log("Session:", session);
    if (session) {
      refreshSpotifyAuth();

      const randomRequestKey = Math.random().toString(36).substring(7);
      pb.collection("editions")
        .getFullList({ requestKey: randomRequestKey, sort: "-created" })
        .then((data) => {
          const transformedEditions: Edition[] = data.map((item) => ({
            id: item.id,
            title: item.title,
            date: item.date,
            teams: item.teams,
            winner_team: item.winner_team,
            blurb: item.blurb,
            home_song: item.home_song,
            created: item.created,
            updated: item.updated,
            edition_gif: item.edition_gif,
            end_gif_1: item.end_gif_1,
            end_gif_2: item.end_gif_2,
          }));
          setEditions(transformedEditions);
          setError(null);
        })
        .catch((err) => {
          console.error("Failed to fetch editions:", err);
          setError("Failed to fetch editions. Please try again later.");
        })
        .finally(() => setLoading(false));
    }
  }, [session]);


  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>You need to be logged in to access the dashboard.</p>;
  }

  if (error) {
    return <div className="p-10">{error}</div>;
  }

  const handleDelete = async (id: string) => {
    try {
      await refreshAuthState();
      const wagerTarget = await pb.collection("wager_rounds").getFullList({ filter: `edition_id = "${id}"` });
      const deleteWager = await pb.collection("wager_rounds").delete(wagerTarget[0].id);
      console.log("削除!", deleteWager);

      const roundTargets = await pb.collection("rounds").getFullList({ filter: `edition_id = "${id}"` });

      roundTargets.forEach(async (round) => {
        const roundNumber = round.round;
        await pb.collection("rounds").delete(round.id);
        console.log(`Round ${roundNumber} - 削除!`);
      });

      const roundQuestions = await pb.collection("questions").getFullList({ filter: `edition_id = "${id}"` });
      roundQuestions.forEach(async (question) => {
        await pb.collection("questions").delete(question.id);
        console.log(`Round ${question.round_number} Question ${question.question_number} - 削除!`);
      });

      const impossibleRounds = await pb.collection("impossible_rounds").getFullList({ filter: `edition_id = "${id}"` });
      impossibleRounds.forEach(async (impossible) => {
        await pb.collection("impossible_rounds").delete(impossible.id);
        console.log(`Impossible ${impossible.impossible_number} Impossible - 削除!`);
      });

      const finalRound = await pb.collection("final_rounds").getFirstListItem(`edition_id = "${id}"`);
      await pb.collection("final_rounds").delete(finalRound.id);
      console.log(`Final Round - 削除!`);

      const edition = await pb.collection("editions").delete(id);
      console.log("Edition deleted:", edition);

      // update the editions.map in the return
      const updatedEditions = editions.filter((edition) => edition.id !== id);
      setEditions(updatedEditions);

    } catch (err) {
      console.error("Failed to delete edition:", err);
      // setError("Failed to delete the edition. Please try again later.");
    }
  };

  const refreshSpotifyAuth = async () => {
    // Check if a valid token exists in localStorage
    const savedToken = localStorage.getItem("spotifyAuthToken");
    const savedTokenExpiry = localStorage.getItem("spotifyAuthTokenExpiry");
    const savedRefreshToken = localStorage.getItem("spotifyAuthRefreshToken");

    // if token is expired, refresh it
    if (savedToken && savedTokenExpiry && savedRefreshToken) {
      console.log('Token:', savedToken);
      console.log('Expiry:', savedTokenExpiry);
      console.log('Refresh Token:', savedRefreshToken);
      const expiry = parseInt(savedTokenExpiry);
      const now = Date.now();
      if (expiry < now) {
        try {
          const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET}`,
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: savedRefreshToken,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("spotifyAuthToken", data.access_token);
            localStorage.setItem("spotifyAuthTokenExpiry", (Date.now() + data.expires_in * 1000).toString());
            console.log("Refreshed Spotify token successfully:", data.access_token);
          } else {
            console.error("Failed to refresh Spotify token:", await response.json());
          }
        } catch (error) {
          console.error("Failed to refresh Spotify token:", error);
        }
      }
    } else {
      // If no valid token, initiate OAuth
      try {
        const randomRequestKey = Math.random().toString(36).substring(7);
        const authData = await pb.collection("users").authWithOAuth2({
          requestKey: randomRequestKey,
          provider: "spotify",
          scopes: [
            "streaming user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-modify-private user-read-playback-position user-read-email"
          ],
        });

        console.log("authData", authData);

        // Save token and user info in localStorage
        if (authData.meta?.accessToken) {
          localStorage.setItem("spotifyAuthToken", authData.meta.accessToken);
          localStorage.setItem("spotifyAuthRefreshToken", authData.meta.refreshToken);
          localStorage.setItem("spotifyAuthTokenExpiry", authData.meta.expiry);
          console.log("Authenticated with Spotify successfully:", authData.meta.name);
        }

      } catch (error) {
        console.error("Failed to refresh Spotify auth state:", error);
      }
    }
  }



  const refreshAuthState = async () => {
    if (!pb.authStore.isValid) {
      try {
        const adminEmail = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_EMAIL ?? '';
        const adminPass = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_PW ?? '';

        if (!adminEmail || !adminPass) {
          throw new Error("Admin email or password is not set in environment variables");
        }

        await pb.admins.authWithPassword(adminEmail, adminPass);
        console.log("Authenticated successfully:", pb.authStore.isValid);
      } catch (error) {
        console.error("Failed to refresh auth state:", error);
      }
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-3xl mb-6">Welcome to the Nerd Trivia 3000 Admin Dashboard, {session.user?.name?.split(' ')[0]}!</h1>
      <h2 className="text-2xl mb-8">Editions</h2>
      <div className="ml-4">
        <ul>
          {loading ? (
            <div>
              <p className="mb-3">Loading editions . . .</p>
              <Progress
                size="md"
                isIndeterminate
                aria-label="Loading editions"
                className="max-w-md"
              />
            </div>
          ) : (
            editions.map((edition) => (
              <li key={edition.id} className="mb-8">
                <strong>{edition.title}</strong> -{" "}
                {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(edition.date))}
                <div className="my-4">
                  <Button as={Link} href={`/editions/${edition.id}/edit`}>Edit</Button>
                  <Button className="mx-4" onClick={() => handleDelete(edition.id)}>Delete</Button>
                  <Button as={Link} href={`/editions/${edition.id}/present`}>Present</Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="flex flex-col gap-4">
        <Button className="mt-6 w-fit" as={Link} href="/editions/new">Create New Edition</Button>
        <Button className="w-fit" onClick={() => signOut()}>Logout</Button>
      </div>
    </div>
  );
}
