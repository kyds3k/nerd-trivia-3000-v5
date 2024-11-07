"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import pb from "../../lib/pocketbase";
import { Edition } from "../../types/pocketbase";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      const randomRequestKey = Math.random().toString(36).substring(7);
      pb.collection("editions").getFullList({requestKey: randomRequestKey}).then((data) => {
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
      }).catch((err) => {
        console.error("Failed to fetch editions:", err);
        setError("Failed to fetch editions. Please try again later.");
      });
    }
  }, [session]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>You need to be logged in to access the dashboard.</p>;
  }

  if (error) {
    return <p>{error}</p>;
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
    <div>
      <h1>Welcome to the Nerd Trivia 3000 Admin Dashboard, {session.user?.name}!</h1>
      <h2>Editions</h2>
      <ul>
        {editions.map((edition) => (
          <li key={edition.id}>
            <strong>{edition.title}</strong> - {edition.date}
            <div>
              <Link href={`/editions/${edition.id}/edit`}>Edit</Link>
              <button onClick={() => handleDelete(edition.id)}>Delete</button>
              <Link href={`/editions/${edition.id}/moderate`}>Moderate</Link>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/editions/new">Create New Edition</Link>
    </div>
  );
}