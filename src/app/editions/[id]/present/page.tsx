"use client"

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import pb from "@/lib/pocketbase";
import { Image } from "@nextui-org/react";
import { set } from "lodash";
import DOMPurify from "dompurify"; // Import the sanitizer

export default function EditionPage() {
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [date, setDate] = useState<string | null>(null);
  const [editionTitle, setEditionTitle] = useState<string | null>(null);
  const [editionGif, setEditionGif] = useState<string | null>(null);
  const [blurb, setBlurb] = useState<string | null>(null);

  interface Edition {
    title: string;
    date: string;
    edition_gif: string;
    blurb: string;
    // Add other fields if needed, e.g., `id: string`, `description: string`, etc.
  }
 
  const edition = async () => {
    try {
      const response = await pb.collection("editions").getOne<Edition>(`${editionId}`);

      if (response.date) {
        const formattedDate = new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(response.date));

        setDate(formattedDate);
      }            

      setEditionTitle(response.title); // TypeScript now knows `response` has a `title` property
      // Format the date

      setEditionGif(response.edition_gif);

      // Sanitize and set HTML content
      if (response.blurb) {
        const sanitizedHtml = DOMPurify.sanitize(response.blurb); // Clean the HTML
        setBlurb(sanitizedHtml);
      }

    } catch (error) {
      console.error("Failed to fetch edition:", error);
    }
  };
  

  useEffect(() => {
    if (editionId) {
      edition();
    }
  }, [editionId]);

  return (
    <div className="p-10 flex flex-col items-center justify-center">
      <h3 className="text-4xl mb-4">Nerd Trivia: {date}</h3>
      <h1 className="text-5xl">{editionTitle}</h1>
      {editionGif && <Image src={editionGif} alt="Edition GIF" width="800" className="my-16" />}
      {blurb && (
        <div
          className="text-3xl"
          dangerouslySetInnerHTML={{ __html: blurb }}
        />
      )}
    </div>
  );
}