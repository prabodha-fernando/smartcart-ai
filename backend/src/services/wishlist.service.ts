import type { HydratedDocument } from "mongoose";
import { Wishlist, type IWishlist } from "../models/Wishlist.js";
import type { AddWishlistItemInput } from "../validators/wishlist.validator.js";
import { ApiError } from "../utils/ApiError.js";
import { fetchProductSnapshot } from "./product.service.js";

export interface SerializedWishlistItem {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
}

export interface SerializedWishlist {
  id: string;
  items: SerializedWishlistItem[];
  totalItems: number;
}

function serializeWishlist(
  wishlist: HydratedDocument<IWishlist>
): SerializedWishlist {
  const items = wishlist.items.map((item) => ({
    productId: item.productId,
    title: item.title,
    price: item.price,
    thumbnail: item.thumbnail,
  }));

  return {
    id: wishlist.id as string,
    items,
    totalItems: items.length,
  };
}

async function getOrCreateWishlist(userId: string) {
  const existingWishlist = await Wishlist.findOne({ user: userId });

  return existingWishlist ?? Wishlist.create({ user: userId, items: [] });
}

export async function getWishlistForUser(userId: string) {
  const wishlist = await getOrCreateWishlist(userId);

  return serializeWishlist(wishlist);
}

export async function addItemToWishlist(
  userId: string,
  input: AddWishlistItemInput
) {
  const wishlist = await getOrCreateWishlist(userId);
  const alreadyExists = wishlist.items.some(
    (item) => item.productId === input.productId
  );

  if (alreadyExists) {
    throw ApiError.conflict("Product already exists in wishlist");
  }

  const product = await fetchProductSnapshot(input.productId);

  wishlist.items.push({
    productId: product.productId,
    title: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
  });
  await wishlist.save();

  return serializeWishlist(wishlist);
}

export async function removeItemFromWishlist(
  userId: string,
  productId: number
) {
  const wishlist = await getOrCreateWishlist(userId);
  const itemIndex = wishlist.items.findIndex(
    (item) => item.productId === productId
  );

  if (itemIndex === -1) {
    throw ApiError.notFound("Product not found in wishlist");
  }

  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();

  return serializeWishlist(wishlist);
}
