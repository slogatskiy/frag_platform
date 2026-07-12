"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { createPost } from "@/app/actions/posts";
import { createClient } from "@/lib/supabase/client";

// Форма создания поста об аромате: рейтинг 1–10 (опц.) + текст + фото.
export function PostComposer({
  fragranceId,
  placeholder = "Share your impression — how does it wear, when do you reach for it?",
}: {
  fragranceId: string;
  placeholder?: string;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canPost = (body.trim().length > 0 || rating != null || !!imageUrl) && !uploading;

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
      const path = `${fragranceId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("post-images")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed. Are you signed in?");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={createPost} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <input type="hidden" name="fragranceId" value={fragranceId} />
      <input type="hidden" name="rating" value={rating ?? ""} />
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs uppercase tracking-wide text-neutral-500">Rating</span>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating((r) => (r === n ? null : n))}
            className={`h-8 w-8 rounded-full text-sm transition ${
              rating != null && n <= rating
                ? "bg-amber-400 font-semibold text-neutral-900"
                : "border border-white/10 text-neutral-400 hover:border-white/30"
            }`}
          >
            {n}
          </button>
        ))}
        {rating != null && (
          <button type="button" onClick={() => setRating(null)} className="ml-1 text-xs text-neutral-500 hover:text-neutral-300">
            clear
          </button>
        )}
      </div>

      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={placeholder}
        className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-neutral-950/50 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-400/40 focus:outline-none"
      />

      {/* Фото-превью */}
      {imageUrl && (
        <div className="relative mt-3 inline-block">
          <img src={imageUrl} alt="preview" className="max-h-56 rounded-xl border border-white/10 object-cover" />
          <button
            type="button"
            onClick={() => {
              setImageUrl("");
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white hover:bg-black"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <label className="cursor-pointer text-sm text-neutral-400 transition hover:text-neutral-200">
          {uploading ? "Uploading…" : imageUrl ? "Change photo" : "📷 Add photo"}
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
        </label>
        <button
          type="submit"
          disabled={!canPost}
          className="rounded-full bg-neutral-100 px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Post
        </button>
      </div>

      {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
    </form>
  );
}
