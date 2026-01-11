// src/app/page.tsx
"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Entry = {
  id: string;
  body: string;
  createdAt: number;
};

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
  return `${month}/${day}/${year} • ${hours}:${minutesStr}${ampm}`;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function useAutosizeTextarea(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  setHeight: React.Dispatch<React.SetStateAction<number>>
) {
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set height based on scrollHeight, but cap at 600px
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 600;
    const currentHeight = Math.min(scrollHeight, maxHeight);
    textarea.style.height = `${currentHeight}px`;
    
    // Track the current height for radius calculation
    setHeight(currentHeight);
    
    // Enable scrolling if content exceeds max height
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }
  }, [value, textareaRef, setHeight]);
}

function getStorageKey(userId: string | null): string {
  if (userId) {
    return `micromsg.entries.v1.${userId}`;
  }
  return "micromsg.entries.v1";
}

function loadEntriesFromStorage(userId: string | null): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const storageKey = getStorageKey(userId);
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function saveEntriesToStorage(entries: Entry[], userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const storageKey = getStorageKey(userId);
    localStorage.setItem(storageKey, JSON.stringify(entries));
  } catch {
    // Ignore storage errors
  }
}

export default function Page() {
  const router = useRouter();
  const [user, setUser] = React.useState<{ id: string } | null>(null);
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [draft, setDraft] = React.useState("");
  const [textareaHeight, setTextareaHeight] = React.useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const feedEndRef = React.useRef<HTMLDivElement>(null);
  useAutosizeTextarea(textareaRef, draft, setTextareaHeight);

  // Get current user on mount
  React.useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load entries from localStorage on mount and when user changes
  React.useEffect(() => {
    const loaded = loadEntriesFromStorage(user?.id ?? null);
    setEntries(loaded);
  }, [user?.id]);

  // Save entries to localStorage whenever entries change
  React.useEffect(() => {
    if (entries.length > 0 || localStorage.getItem(getStorageKey(user?.id ?? null)) !== null) {
      saveEntriesToStorage(entries, user?.id ?? null);
    }
  }, [entries, user?.id]);

  // Scroll to bottom when new entry is added (not on initial load)
  const isInitialMount = React.useRef(true);
  const prevEntriesLengthRef = React.useRef(0);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevEntriesLengthRef.current = entries.length;
      return;
    }
    if (feedEndRef.current && entries.length > prevEntriesLengthRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 0);
    }
    prevEntriesLengthRef.current = entries.length;
  }, [entries.length]);

  const handleSend = React.useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const newEntry: Entry = {
      id: generateId(),
      body: trimmed,
      createdAt: Date.now(),
    };

    setEntries((prev) => [...prev, newEntry]);
    setDraft("");
  }, [draft]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Compute container height: textarea height + padding (py-2 = 8px top + 8px bottom = 16px)
  const containerHeight = textareaHeight + 16;
  
  // Determine radius class based on container height
  // <= 56px: rounded-full, <= 140px: rounded-2xl, > 140px: rounded-xl
  const composerRadiusClass =
    containerHeight <= 56
      ? "rounded-full"
      : containerHeight <= 140
      ? "rounded-2xl"
      : "rounded-xl";

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50">
      {/* Sticky full-width header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95">
        <div className="mx-auto flex h-14 max-w-none items-center justify-between px-4">
          <div className="text-sm font-medium">Micromsg</div>

          <button
            type="button"
            aria-label="Log out"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
              router.refresh();
            }}
            className="inline-flex size-10 items-center justify-center rounded-md text-neutral-200 hover:bg-neutral-900 active:bg-neutral-800 cursor-pointer"
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </header>

      {/* Feed + composer constrained to “mobile-like” width */}
      <main className="mx-auto max-w-lg px-4">
        {/* Feed scroll area */}
        <div
          className="
            relative
            pb-32
            pt-10
          "
        >
          <div className="space-y-10">
            {entries.map((e) => (
              <article key={e.id}>
                <p className="text-base leading-6 text-neutral-100">{e.body}</p>
                <p className="text-sm leading-5 tabular-nums text-neutral-500 mt-1">
                  {formatTimestamp(e.createdAt)}
                </p>
              </article>
            ))}
            <div ref={feedEndRef} />
          </div>
        </div>

        {/* Bottom composer (fixed), centered to same max width */}
        <div className="fixed left-0 right-0 z-30" style={{ bottom: "calc(24px + env(safe-area-inset-bottom))" }}>
          <div className="mx-auto max-w-lg px-4">
            <div className={`mb-4 relative min-h-[44px] flex items-center ${composerRadiusClass} border border-neutral-800 bg-neutral-900/60 pl-4 pr-[6px] py-2`}>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Share a thought.."
                className="
                  w-full resize-none bg-transparent text-base text-neutral-100
                  placeholder:text-neutral-500
                  focus:outline-none
                  leading-6
                  pr-[54px]
                  py-0
                "
                style={{ maxHeight: "600px" }}
              />

              <button
                type="button"
                aria-label="Send"
                onClick={handleSend}
                className="absolute right-[6px] bottom-[6px] inline-flex size-8 items-center justify-center rounded-full bg-neutral-50 text-neutral-950 hover:bg-neutral-200 active:bg-neutral-300 cursor-pointer"
              >
                <Icon name="send" size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
