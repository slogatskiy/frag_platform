"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";

// Редактор своего профиля: имя, био, загрузка аватарки в Supabase Storage.
// Показывается только владельцу; по кнопке разворачивается форма.
export function ProfileEditor({
  handle,
  initialName,
  initialBio,
  initialAvatarUrl,
}: {
  handle: string;
  initialName: string | null;
  initialBio: string | null;
  initialAvatarUrl: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    if (file.size > 8 * 1024 * 1024) {
      setErr("Image is too large (max 8 MB).");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `avatars/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("post-images")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed. Are you signed in?");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30"
      >
        Edit profile
      </button>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <form
            action={updateProfile}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Edit profile</h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-neutral-500 transition hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <input type="hidden" name="avatarUrl" value={avatarUrl} />

      <div className="mt-5 flex items-center gap-4">
        <Avatar name={initialName} handle={handle} avatarUrl={avatarUrl || null} size="xl" />
        <label className="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-200 transition hover:border-white/30">
          {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "📷 Upload avatar"}
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
        </label>
        {avatarUrl && (
          <button
            type="button"
            onClick={() => {
              setAvatarUrl("");
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="text-sm text-neutral-500 transition hover:text-rose-400"
          >
            Remove
          </button>
        )}
      </div>

      <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Display name
      </label>
      <input
        name="name"
        defaultValue={initialName ?? ""}
        maxLength={50}
        placeholder="Your name"
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-neutral-950/50 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/40 focus:outline-none"
      />

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Bio
      </label>
      <textarea
        name="bio"
        defaultValue={initialBio ?? ""}
        rows={2}
        maxLength={280}
        placeholder="Woody-oriental lover. Blind-buy addict. Ask me about Amouage."
        className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-neutral-950/50 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/40 focus:outline-none"
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={uploading}
          className="rounded-full bg-neutral-100 px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-neutral-500 transition hover:text-neutral-200"
        >
          Cancel
        </button>
        {err && <span className="text-sm text-rose-400">{err}</span>}
      </div>
          </form>
        </div>
      )}
    </>
  );
}
