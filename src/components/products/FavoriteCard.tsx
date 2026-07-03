"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Check,
  Pencil,
  ShoppingCart,
  Star,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { FavoriteItem } from "@/types/product";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import toast from "react-hot-toast";

const NOTE_MAX = 140;

export default function FavoriteCard({
  item,
  priority = false,
}: {
  item: FavoriteItem;
  priority?: boolean;
}) {
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const updateNote = useFavoritesStore((state) => state.updateNote);
  const addItem = useCartStore((state) => state.addItem);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.note ?? "");

  const roundedRating = Math.round(item.rating);

  // DELETE
  const handleRemove = () => {
    removeFavorite(item.id);
    toast.success(`${item.title} removed from favorites`);
  };

  const handleAddToCart = () => {
    addItem(item);
    toast.success(`${item.title} added to cart`);
  };

  // UPDATE
  const startEditing = () => {
    setDraft(item.note ?? "");
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(item.note ?? "");
    setEditing(false);
  };

  const saveNote = () => {
    updateNote(item.id, draft);
    setEditing(false);
    toast.success(draft.trim() ? "Note saved" : "Note removed");
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group premium-card flex h-full flex-col p-6"
    >
      <Link href={`/products/${item.id}`} className="block">
        <div className="relative h-52 w-full overflow-hidden rounded-xl bg-white">
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            loading={priority ? "eager" : "lazy"}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <h3 className="mt-5 line-clamp-2 font-display text-2xl font-semibold leading-tight text-slate-950">
          {item.title}
        </h3>
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={15}
              className={
                index < roundedRating ? "fill-amber-400" : "text-slate-200"
              }
            />
          ))}
        </div>
        <span className="text-sm font-medium text-slate-500">
          {item.rating.toFixed(1)}
        </span>
      </div>

      {/* Personal note — the update operation */}
      <div className="mt-4">
        {editing ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <textarea
              value={draft}
              onChange={(event) =>
                setDraft(event.target.value.slice(0, NOTE_MAX))
              }
              autoFocus
              rows={2}
              placeholder="Add a note (e.g. gift for Sam, wait for sale)..."
              className="w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {draft.length}/{NOTE_MAX}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={cancelEditing}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-200"
                >
                  <X size={13} />
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800"
                >
                  <Check size={13} />
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : item.note ? (
          <button
            onClick={startEditing}
            className="flex w-full items-start gap-2 rounded-xl bg-amber-50 p-3 text-left transition hover:bg-amber-100"
          >
            <StickyNote size={15} className="mt-0.5 shrink-0 text-amber-500" />
            <span className="flex-1 text-sm text-slate-700">{item.note}</span>
            <Pencil size={13} className="mt-0.5 shrink-0 text-slate-400" />
          </button>
        ) : (
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          >
            <StickyNote size={13} />
            Add note
          </button>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="font-display text-2xl font-bold text-slate-950">
          ${item.price.toFixed(2)}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRemove}
            aria-label={`Remove ${item.title} from favorites`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition hover:bg-rose-100"
          >
            <Trash2 size={19} />
          </button>
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${item.title} to cart`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-white transition hover:bg-blue-700"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
