"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Pocketbase from "pocketbase";
import { Edition } from "../../types/pocketbase";
import { Button } from "@heroui/button";
import { Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { useRouter } from "next/navigation";
import ShallNotPass from "../../components/ShallNotPass";
import { set } from "lodash";
import { useSession } from "next-auth/react";



// Create an intersection type to handle the UI flag
type EditionWithFlags = Edition & { isWip?: boolean; progress?: any };

// Helper: Sleep function to add delays between requests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function DashboardPage() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();

  // Updated state to use the new type
  const [editions, setEditions] = useState<EditionWithFlags[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAuth, setGoogleAuth] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<string>("");
  const [googleAvatar, setGoogleAvatar] = useState<string>("");
  const { data: session } = useSession();
  const [wipEditions, setWipEditions] = useState<any[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteComplete, setDeleteComplete] = useState<boolean>(false);


  interface GoogleData {
    meta: {
      name: string;
      avatarURL: string;
    };
  }

  const logoutGoogle = async () => {
    try {
      const response = await pb.authStore.clear();
      if (response !== null) {
        setGoogleAuth(false);
        router.push("/");
      }
      console.log("Logout response:", response);
    }
    catch (error) {
      console.error("Failed to logout:", error);
    }
  }


  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setDeleteComplete(false);
    onOpen();

    try {
      await refreshAuthState();
      // Standard delete logic...
      const wagerTarget = await pb.collection("wager_rounds").getFullList({ filter: `edition_id = "${id}"` });
      if (wagerTarget.length > 0) {
        await pb.collection("wager_rounds").delete(wagerTarget[0].id);
      }

      await sleep(300);

      const roundTargets = await pb.collection("rounds").getFullList({ filter: `edition_id = "${id}"` });

      for (const round of roundTargets) {
        await pb.collection("rounds").delete(round.id);
        await sleep(200);
      }

      await sleep(300);

      const roundQuestions = await pb.collection("questions").getFullList({ filter: `edition_id = "${id}"` });
      for (const question of roundQuestions) {
        await pb.collection("questions").delete(question.id);
        await sleep(200);
      }

      await sleep(300);

      const impossibleRounds = await pb.collection("impossible_rounds").getFullList({ filter: `edition_id = "${id}"` });
      for (const impossible of impossibleRounds) {
        await pb.collection("impossible_rounds").delete(impossible.id);
        await sleep(200);
      }

      await sleep(300);

      try {
        const finalRound = await pb.collection("final_rounds").getFirstListItem(`edition_id = "${id}"`);
        await pb.collection("final_rounds").delete(finalRound.id);
      } catch (e) {
        console.log("No final round found or delete failed");
      }

      await sleep(300);

      const edition = await pb.collection("editions").delete(id);
      console.log("Edition deleted:", edition);

      // update the editions.map in the return
      const updatedEditions = editions.filter((edition) => edition.id !== id);
      setEditions(updatedEditions);

      setIsDeleting(false);
      setDeleteComplete(true);

    } catch (err) {
      console.error("Failed to delete edition:", err);
      setIsDeleting(false);
      setDeleteComplete(true);
    }
  };


  const refreshAuthState = async () => {
    if (!pb.authStore.isValid) {
      try {
        const adminEmail = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_EMAIL ?? '';
        const adminPass = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_PW ?? '';

        if (!adminEmail || !adminPass) {
          throw new Error("Admin email or password is not set in environment variables");
        }

        await pb.collection("_superusers").authWithPassword(adminEmail, adminPass);
        console.log("Authenticated successfully:", pb.authStore.isValid);
      } catch (error) {
        console.error("Failed to refresh auth state:", error);
      }
    }
  };

  const handleEditWip = (edition: EditionWithFlags) => {
    if (edition.progress) {
      const draftWithId = { ...edition.progress, id: edition.id };
      localStorage.setItem("new_edition_draft", JSON.stringify(draftWithId));
    }
  };

  const handleDeleteWip = async (id: string) => {
    try {
      await refreshAuthState();
      await pb.collection("wip_editions").delete(id);
      // Update the editions state to remove the deleted item
      setEditions((prevEditions) => prevEditions.filter((edition) => edition.id !== id));
    } catch (error) {
      console.error("Failed to delete wip edition:", error);
      setError("Failed to delete wip edition. Please try again later.");
    }
  };

  const handlePresent = async (id: string) => {
    try {
      await refreshAuthState();
      // 1. Get all active editions
      const activeEditions = await pb.collection("editions").getFullList({ filter: "is_active = true" });

      // 2. Set them to inactive
      for (const edition of activeEditions) {
        if (edition.id !== id) {
          await pb.collection("editions").update(edition.id, { is_active: false });
        }
      }

      // 3. Set the selected edition to active
      await pb.collection("editions").update(id, { is_active: true });

      // 4. Navigate to the present page
      router.push(`/edition/${id}/present`);

    } catch (error) {
      console.error("Failed to set active edition:", error);
      // Proceed to navigate anyway, or show error?
      // For now, let's try to navigate anyway so the user isn't stuck
      router.push(`/edition/${id}/present`);
    }
  };



  useEffect(() => {
    console.log("pb.authStore", pb.authStore);
    // if pocketbase_auth is in localstorage, use it to authenticate
    if (pb.authStore.isValid) {
      console.log("AuthStore is valid");
      const authData = localStorage.getItem("pocketbase_auth");
      if (authData) {
        const parsedAuth = JSON.parse(authData);
        console.log('parsedAuth:', parsedAuth);
        console.log('is admin:', parsedAuth.record.is_admin);
        if (parsedAuth.record.is_admin === true) {
          setIsAdmin(true);
          const googleData = localStorage.getItem("google_data");

          const fetchUser = async () => {
            try {
              const parsedData = JSON.parse(authData);
              const id = parsedData.record.id;
              pb.autoCancellation(false)
              const user = await pb.collection("users").getOne(id);

              console.log("ID:", id);
              if (user.is_admin)
                setIsAdmin(true);

              if (googleData) {
                try {
                  const parsedGoogleData: GoogleData = JSON.parse(googleData);
                  setGoogleUser(parsedGoogleData.meta.name);
                  setGoogleAvatar(parsedGoogleData.meta.avatarURL);
                } catch (error) {
                  console.error("Error parsing google_data:", error);
                }
              }

              if (user.is_admin) {
                setIsAdmin(true);
              }
            } catch (error) {
              console.error("Error parsing pocketbase_auth data or fetching user:", error);
            }
          };

          fetchUser();
          const randomRequestKey = Math.random().toString(36).substring(7);

          // FETCH STANDARD EDITIONS
          pb.collection("editions")
            .getFullList({ requestKey: randomRequestKey, sort: "-created" })
            .then((data) => {
              const transformedEditions: EditionWithFlags[] = data.map((item) => ({
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
                isWip: false // <--- FLAGGED AS STANDARD
              }));
              setEditions(transformedEditions);
              setError(null);
            })
            .catch((err) => {
              console.error("Failed to fetch editions:", err);
              setError("Failed to fetch editions. Please try again later.");
            })
            .finally(() => setLoading(false));
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      } else {
        console.log("No pocketbase_auth data found in localStorage.");
      }
    }
  }, []);



  useEffect(() => {
    const fetchWipEditions = async () => {
      try {
        await refreshAuthState();
        const resultList = await pb.collection('wip_editions').getFullList({
          sort: '-created',
        });

        // FETCH WIP EDITIONS
        const transformedWipEditions: EditionWithFlags[] = resultList.map((item) => ({
          id: item.id,
          title: item.progress.title,
          date: item.progress.date,
          teams: [],
          winner_team: "",
          blurb: "",
          home_song: "",
          created: item.created || "",
          updated: item.updated || "",
          edition_gif: "",
          end_gif_1: "",
          end_gif_2: "",
          isWip: true, // <--- FLAGGED AS WIP
          progress: item.progress // <--- ADD PROGRESS DATA
        }));

        // Combine editions and wipEditions
        setEditions((prevEditions) => [...prevEditions, ...transformedWipEditions]);

      } catch (error) {
        console.error("Failed to fetch wip editions:", error);
        setError("Failed to fetch wip editions. Please try again later.");
      }
    };

    fetchWipEditions();
  }, []);


  if (loading) {
    return (
      <div className="flex flex-col gap-5 justify-center items-center h-screen w-screen">
        <Progress isIndeterminate aria-label="Loading..." className="max-w-md" size="sm" />
        <h3 className="text-2xl">Loading...</h3>
      </div>
    );
  }

  if (!isAdmin) {
    return <ShallNotPass />
  }

  if (error) {
    return <div className="p-10">{error}</div>;
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (deleteComplete) {
            onClose();
            setDeleteComplete(false);
          }
        }}
        isDismissable={deleteComplete}
        hideCloseButton={!deleteComplete}
        size="lg"
      >
        <ModalContent>
          <ModalBody className="flex flex-col items-center justify-center py-10">
            <h2 className="text-2xl font-bold mb-6">
              {isDeleting ? "Deleting edition . . ." : "Done!"}
            </h2>
            <img
              src="https://media1.tenor.com/m/o6BRGGiCWWEAAAAC/shizuka-kuze-takopi%27s-original-sin.gif"
              alt="Deleting animation"
              className="max-w-full h-auto"
            />
            {deleteComplete && (
              <Button
                color="primary"
                onPress={() => {
                  onClose();
                  setDeleteComplete(false);
                }}
                className="mt-6"
              >
                Close
              </Button>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <div className="p-10 w-full">
        <h1 className="text-5xl mb-10 text-center">Welcome to the <span className="font-linebeam text-5xl uppercase text-glow-blue-400">Nerd Trivia 3000</span> Admin Terminal</h1>
        <div data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both" className="p-4 md:p-10 w-full nerd-aug bluecard bluecard__alt mb-10">
          <h2 className="text-2xl mb-8">Editions</h2>
          <div className="ml-4">
            {loading ? (
              <>
                <p className="mb-3">Loading editions . . .</p>
                <Progress
                  size="md"
                  isIndeterminate
                  aria-label="Loading editions"
                  className="max-w-md"
                />
              </>
            ) : (
              <ul>
                {editions.map((edition) => (
                  <li key={edition.id} className="mb-8">
                    <strong>{edition.title}</strong> -{" "}
                    {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(edition.date))}
                    <div className="my-4 flex gap-2">
                      {!edition.isWip && (
                        <Button onPress={() => handlePresent(edition.id)}>Present</Button>
                      )}

                      {/* ONLY SHOW ADMIN BUTTON IF NOT WIP */}
                      {!edition.isWip && (
                        <Button as={Link} href={`/edition/${edition.id}/admin`}>Admin</Button>
                      )}

                      <Button
                        as={Link}
                        href={edition.id && !edition.isWip ? `edition/${edition.id}/edit` : `/edition/new`}
                        onClick={() => edition.isWip ? handleEditWip(edition) : null}
                      >
                        Edit
                      </Button>

                      {/* CONDITIONALLY CALL THE CORRECT DELETE FUNCTION */}
                      <Button
                        className="mx-6"
                        color="danger"
                        onClick={() => edition.isWip ? handleDeleteWip(edition.id) : handleDelete(edition.id)}
                      >
                        Delete!
                      </Button>
                    </div>
                  </li>
                ))}
                <li><Button className="mt-6 w-fit" as={Link} href="/edition/new">Create New Edition</Button></li>
              </ul>

            )}
          </div>
        </div>
        <div data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both" className="p-4 md:p-10 w-full nerd-aug bluecard bluecard__alt">
          <h2 className="text-2xl mb-8">I/O</h2>
          <div className="flex flex-col gap-4">

            <Button className="w-fit" onPress={() => logoutGoogle()}>Logout</Button>
          </div>
        </div>
      </div>
    </>
  );
}