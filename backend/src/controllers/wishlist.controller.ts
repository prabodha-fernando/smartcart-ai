import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Wishlist, type IWishlist } from "../models/Wishlist.js";
import { fetchProductSnapshot } from "../services/product.service.js";
import type { HydratedDocument } from "mongoose";

function serializeWishlist(wishlist: HydratedDocument<IWishlist>) {
  const items = wishlist.items.map((i) => ({
    productId: i.productId,
    title: i.title,
    price: i.price,
    thumbnail: i.thumbnail,
    rating: i.rating,
    note: i.note,
  }));
  return { items, totalItems: items.length };
}

async function getOrCreateWishlist(userId: string) {
  const existing = await Wishlist.findOne({ user: userId });
  return existing ?? (await Wishlist.create({ user: userId, items: [] }));
}

/** GET /wishlist */
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.userId!);
  res.json(serializeWishlist(wishlist));
});

/** POST /wishlist/items — add a product (idempotent; updates the note if resent). */
export const addItem = asyncHandler(async (req, res) => {
  const { productId, note } = req.body;
  const wishlist = await getOrCreateWishlist(req.userId!);

  const existing = wishlist.items.find((i) => i.productId === productId);
  if (existing) {
    if (note !== undefined) existing.note = note;
  } else {
    const snapshot = await fetchProductSnapshot(productId);
    wishlist.items.push({ ...snapshot, note: note ?? "" });
  }

  await wishlist.save();
  res.status(201).json(serializeWishlist(wishlist));
});

/** DELETE /wishlist/items/:productId */
export const removeItem = asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    throw ApiError.badRequest("Invalid product id");
  }

  const wishlist = await getOrCreateWishlist(req.userId!);
  const index = wishlist.items.findIndex((i) => i.productId === productId);
  if (index === -1) throw ApiError.notFound("Item not in wishlist");

  wishlist.items.splice(index, 1);
  await wishlist.save();
  res.json(serializeWishlist(wishlist));
});
