"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import pb from "../../lib/pocketbase";
import { Edition } from "../../types/pocketbase";
import { Button } from "@nextui-org/button";
import { Progress } from "@nextui-org/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (session) {
      const randomRequestKey = Math.random().toString(36).substring(7);
      pb.collection("editions").getFullList({ requestKey: randomRequestKey })
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
      await pb.collection("editions").delete(id);
      setEditions(editions.filter((edition) => edition.id !== id));
    } catch (err) {
      console.error("Failed to delete edition:", err);
      setError("Failed to delete the edition. Please try again later.");
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
                <strong>{edition.title}</strong> - {edition.date}
                <div className="my-4">
                  <Button as={Link} href={`/editions/${edition.id}/edit`}>Edit</Button>
                  <Button data-test="test" className="mx-4" onClick={() => handleDelete(edition.id)}>Delete</Button>
                  <Button as={Link} href={`/editions/${edition.id}/moderate`}>Moderate</Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      <Button className="mt-6" as={Link} href="/editions/new">Create New Edition</Button>
    </div>
  );
}
