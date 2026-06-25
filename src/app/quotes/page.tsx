"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getElevatableClient } from "@/lib/pocketbase";
import { elevateAuth } from "@/lib/elevate";
import { Button, Progress } from "@heroui/react";
import Tiptap from "@/components/TipTap";
import DOMPurify from "dompurify";
import ShallNotPass from "@/components/ShallNotPass";
import { toast } from "react-toastify";

interface Quote {
  id: string;
  quote: string;
}

// TipTap emits "<p></p>" for an empty editor — strip tags to test for real text.
const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();

export default function QuotesPage() {
  // Stable elevatable client (in-memory auth store seeded from the session).
  const pb = useMemo(() => getElevatableClient(), []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [newQuote, setNewQuote] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Admin gate (same approach as the dashboard).
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
        const list = await pb.collection("loading_quotes").getFullList<Quote>({ sort: "-created", requestKey: null });
        setQuotes(list);
      } catch (e) {
        console.error("Failed to load quotes:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [pb]);

  const addQuote = async () => {
    if (!stripHtml(newQuote) || saving) return;
    setSaving(true);
    try {
      await elevateAuth(pb);
      const created = await pb.collection("loading_quotes").create<Quote>({ quote: newQuote });
      setQuotes((prev) => [created, ...prev]); // live-update the list
      setNewQuote("");
    } catch (e) {
      console.error("Failed to add quote:", e);
      toast.error("Couldn't add that quote. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      await elevateAuth(pb);
      await pb.collection("loading_quotes").delete(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (e) {
      console.error("Failed to delete quote:", e);
      toast.error("Couldn't delete that quote. Please try again.");
    }
  };

  const startEdit = (q: Quote) => {
    setEditingId(q.id);
    setEditText(q.quote);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (id: string) => {
    if (!stripHtml(editText) || savingEdit) return;
    setSavingEdit(true);
    try {
      await elevateAuth(pb);
      const updated = await pb.collection("loading_quotes").update<Quote>(id, { quote: editText });
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      cancelEdit();
    } catch (e) {
      console.error("Failed to update quote:", e);
      toast.error("Couldn't update that quote. Please try again.");
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
          <span className="font-linebeam uppercase text-glow-blue-400">Loading Quotes</span>
        </h1>
        <Button as={Link} href="/dashboard" variant="bordered">← Back to Dashboard</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: add a quote */}
        <div
          data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both"
          className="p-4 md:p-8 w-full nerd-aug bluecard bluecard__alt h-fit"
        >
          <h2 className="text-2xl mb-6">Add a Quote</h2>
          <Tiptap
            state={newQuote}
            setState={setNewQuote}
            identifier="quote-new"
            classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-32 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
          />
          <span className="text-xs text-gray-500 block mt-2">Select text to italicize, bold, etc.</span>
          <Button
            color="primary"
            className="mt-6 w-fit"
            onPress={addQuote}
            isLoading={saving}
            isDisabled={!stripHtml(newQuote)}
          >
            Add Quote
          </Button>
        </div>

        {/* RIGHT: current quotes */}
        <div
          data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both"
          className="p-4 md:p-8 w-full nerd-aug bluecard bluecard__alt"
        >
          <h2 className="text-2xl mb-6">Current Quotes ({quotes.length})</h2>
          {quotes.length === 0 ? (
            <p className="text-gray-500">No quotes yet — add one on the left.</p>
          ) : (
            <ul className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {quotes.map((q) => (
                <li
                  key={q.id}
                  className="flex items-start justify-between gap-3 border border-cyan-900 bg-black/40 p-3"
                >
                  {editingId === q.id ? (
                    <div key="edit" className="flex flex-col gap-2 w-full">
                      <Tiptap
                        state={editText}
                        setState={setEditText}
                        identifier={`quote-edit-${q.id}`}
                        classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-24 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          onPress={() => saveEdit(q.id)}
                          isLoading={savingEdit}
                          isDisabled={!stripHtml(editText)}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="flat" onPress={cancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div key="view" className="flex items-start justify-between gap-3 w-full">
                      <span className="text-lg [&_p]:m-0" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.quote) }} />
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="flat" onPress={() => startEdit(q)}>Edit</Button>
                        <Button size="sm" color="danger" variant="flat" onPress={() => deleteQuote(q.id)}>Delete</Button>
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
