"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getElevatableClient } from "@/lib/pocketbase";
import { elevateAuth } from "@/lib/elevate";
import { Button, Input, Progress } from "@heroui/react";
import Tiptap from "@/components/TipTap";
import ShallNotPass from "@/components/ShallNotPass";
import { toast } from "react-toastify";

interface Tiebreaker {
  id: string;
  question: string;
  answer: number;
  is_active?: boolean;
}

// TipTap emits "<p></p>" for an empty editor — strip tags to test for real text.
const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();

export default function TiebreakersPage() {
  const pb = useMemo(() => getElevatableClient(), []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tiebreakers, setTiebreakers] = useState<Tiebreaker[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!pb.authStore.isValid) {
        setLoading(false);
        return;
      }
      const authData = localStorage.getItem("pocketbase_auth");
      const admin = authData ? JSON.parse(authData)?.record?.is_admin === true : false;
      setIsAdmin(admin);
      if (!admin) {
        setLoading(false);
        return;
      }

      try {
        await elevateAuth(pb);
        pb.autoCancellation(false);
        const list = await pb.collection("tiebreakers").getFullList<Tiebreaker>({ sort: "-created", requestKey: null });
        setTiebreakers(list);
      } catch (e) {
        console.error("Failed to load tiebreakers:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [pb]);

  const addTiebreaker = async () => {
    const a = answer.trim();
    if (!stripHtml(question) || a === "" || saving) return;
    const answerNum = Number(a.replace(/,/g, ""));
    if (!Number.isFinite(answerNum)) {
      toast.error("Answer must be a number.");
      return;
    }
    setSaving(true);
    try {
      await elevateAuth(pb);
      const created = await pb.collection("tiebreakers").create<Tiebreaker>({
        question: question,
        answer: answerNum,
        is_active: false,
      });
      setTiebreakers((prev) => [created, ...prev]); // live-update
      setQuestion("");
      setAnswer("");
    } catch (e) {
      console.error("Failed to add tiebreaker:", e);
      toast.error("Couldn't add that tiebreaker. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTiebreaker = async (id: string) => {
    try {
      await elevateAuth(pb);
      await pb.collection("tiebreakers").delete(id);
      setTiebreakers((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error("Failed to delete tiebreaker:", e);
      toast.error("Couldn't delete that tiebreaker. Please try again.");
    }
  };

  const startEdit = (t: Tiebreaker) => {
    setEditingId(t.id);
    setEditQuestion(t.question);
    setEditAnswer(String(t.answer ?? ""));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  const saveEdit = async (id: string) => {
    const a = editAnswer.trim();
    if (!stripHtml(editQuestion) || a === "" || savingEdit) return;
    const answerNum = Number(a.replace(/,/g, ""));
    if (!Number.isFinite(answerNum)) {
      toast.error("Answer must be a number.");
      return;
    }
    setSavingEdit(true);
    try {
      await elevateAuth(pb);
      const updated = await pb.collection("tiebreakers").update<Tiebreaker>(id, {
        question: editQuestion,
        answer: answerNum,
      });
      setTiebreakers((prev) => prev.map((t) => (t.id === id ? updated : t)));
      cancelEdit();
    } catch (e) {
      console.error("Failed to update tiebreaker:", e);
      toast.error("Couldn't update that tiebreaker. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 justify-center items-center h-screen w-screen">
        <Progress isIndeterminate aria-label="Loading..." className="max-w-md" size="sm" />
        <h3 className="text-2xl">Loading...</h3>
      </div>
    );
  }

  if (!isAdmin) return <ShallNotPass />;

  return (
    <div className="p-6 md:p-10 w-full">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-4xl md:text-5xl">
          <span className="font-linebeam uppercase text-glow-blue-400">Tiebreakers</span>
        </h1>
        <Button as={Link} href="/dashboard" variant="bordered">← Back to Dashboard</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: add a tiebreaker */}
        <div
          data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both"
          className="p-4 md:p-8 w-full nerd-aug bluecard bluecard__alt h-fit"
        >
          <h2 className="text-2xl mb-6">Add a Tiebreaker</h2>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm">Question</label>
              <Tiptap
                state={question}
                setState={setQuestion}
                identifier="tb-new"
                classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-32 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
              />
              <span className="text-xs text-gray-500">Select text to italicize, bold, etc.</span>
            </div>
            <Input
              label="Answer (number)"
              labelPlacement="outside"
              placeholder="e.g. 102"
              type="text"
              inputMode="numeric"
              value={answer}
              onValueChange={(v) => setAnswer(v.replace(/[^0-9.,-]/g, ""))}
              variant="bordered"
              radius="none"
              classNames={{
                inputWrapper:
                  "border-2 border-cyan-500 focus-within:border-cyan-500 bg-black text-white !border-cyan-500",
                input: "placeholder-gray-400 text-white",
              }}
            />
            <Button
              color="primary"
              className="w-fit"
              onPress={addTiebreaker}
              isLoading={saving}
              isDisabled={!stripHtml(question) || answer.trim() === ""}
            >
              Add Tiebreaker
            </Button>
          </div>
        </div>

        {/* RIGHT: current tiebreakers */}
        <div
          data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both"
          className="p-4 md:p-8 w-full nerd-aug bluecard bluecard__alt"
        >
          <h2 className="text-2xl mb-6">Current Tiebreakers ({tiebreakers.length})</h2>
          {tiebreakers.length === 0 ? (
            <p className="text-gray-500">No tiebreakers yet — add one on the left.</p>
          ) : (
            <ul className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {tiebreakers.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-3 border border-cyan-900 bg-black/40 p-3"
                >
                  {editingId === t.id ? (
                    <div key="edit" className="flex flex-col gap-2 w-full">
                      <Tiptap
                        state={editQuestion}
                        setState={setEditQuestion}
                        identifier={`tb-edit-${t.id}`}
                        classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-24 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                      />
                      <Input
                        value={editAnswer}
                        onValueChange={(v) => setEditAnswer(v.replace(/[^0-9.,-]/g, ""))}
                        type="text"
                        inputMode="numeric"
                        placeholder="Answer (number)"
                        variant="bordered"
                        radius="none"
                        classNames={{
                          inputWrapper:
                            "border-2 border-cyan-500 focus-within:border-cyan-500 bg-black text-white !border-cyan-500",
                          input: "text-white",
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          onPress={() => saveEdit(t.id)}
                          isLoading={savingEdit}
                          isDisabled={!stripHtml(editQuestion) || editAnswer.trim() === ""}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="flat" onPress={cancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div key="view" className="flex items-start justify-between gap-3 w-full">
                      <div className="flex flex-col gap-1">
                        <span className="text-lg" dangerouslySetInnerHTML={{ __html: t.question }} />
                        <span className="text-sm text-cyan-400 font-mono">
                          Answer: {Number(t.answer).toLocaleString()}
                        </span>
                        {t.is_active && (
                          <span className="text-xs uppercase tracking-widest text-green-400">● Active</span>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="flat" onPress={() => startEdit(t)}>Edit</Button>
                        <Button size="sm" color="danger" variant="flat" onPress={() => deleteTiebreaker(t.id)}>Delete</Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
