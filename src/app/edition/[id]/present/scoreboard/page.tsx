"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Pocketbase, { RecordModel } from "pocketbase";
import { Image, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, getKeyValue } from "@nextui-org/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";
import { set } from "lodash";

interface Edition {
  title: string;
  date: string;
  edition_gif: string;
  blurb: string;
  home_song: string;
  // Add other fields if needed, e.g., `id: string`, `description: string`, etc.
}

export default function Scoreboard() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const params = useParams();
  const router = useRouter();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [scores, setScores] = useState<RecordModel[]>([]);

  const getScores = async () => {
    console.log("editionId", editionId);
    pb.autoCancellation(false);
    const scoreList = await pb.collection('teams').getFullList({ filter: `current_edition = "${editionId}"`, sort: '-points_for_game', fields: 'team_name, points_for_game' });
    console.log(scoreList);
    setScores(scoreList);
  }

  const origin = localStorage.getItem("impossibleSource");

  useHotkeys("ctrl+ArrowRight", () => {
    if (origin === "1")
      router.push(`/edition/${editionId}/present/round/2`);
    else
      router.push(`/edition/${editionId}/present/round/3`);
  });


  useHotkeys("ctrl+ArrowLeft", () => {
   router.push(`/edition/${editionId}/present/impossible/${origin}`);    
  });

  useEffect(() => {
    getScores();
  }, []);

  return (
    <div className="p-4 md:p-10">
      <h1 className="text-4xl text-center mb-10">Scoreboard</h1>
      <div className="flex justify-center">
        <Table isStriped className="table-auto w-3/4">
          <TableHeader>
            <TableColumn className="px-4 py-2 text-3xl">Team</TableColumn>
            <TableColumn className="px-4 py-2 text-3xl">Points</TableColumn>
          </TableHeader>
          <TableBody>
            {scores.map((score, index) => (
              <TableRow
                key={index}
                className="fade-in-up"
                style={{
                  animationDelay: `${(scores.length - index - 1) * 2}s`, // Delay based on reverse index
                }}
              >
                <TableCell className="text-2xl">{score.team_name}</TableCell>
                <TableCell className="text-2xl">{score.points_for_game}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}