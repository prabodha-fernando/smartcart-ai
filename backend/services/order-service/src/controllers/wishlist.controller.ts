import { asyncHandler } from "@smartcart/shared";
import { ApiError } from "@smartcart/shared";
import {
  addItemToWishlist,
  getWishlistForUser,
  removeItemFromWishlist,
} from "../services/wishlist.service.js";
import type {
  AddWishlistItemInput,
  WishlistItemParamInput,
} from "@smartcart/shared";

function getUserId(userId?: string) {
  if (!userId) {
    throw ApiError.unauthorized("Unauthorized");
  }

  return userId;
}

/** GET /wishlist */
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getWishlistForUser(getUserId((req as any).userId));

  res.status(200).json({
    success: true,
    message: "Wishlist fetched successfully",
    data: { wishlist },
  });
});

/** POST /wishlist/items */
export const addWishlistItem = asyncHandler(async (req, res) => {
  const wishlist = await addItemToWishlist(
    getUserId((req as any).userId),
    req.body as AddWishlistItemInput
  );

  res.status(201).json({
    success: true,
    message: "Product added to wishlist",
    data: { wishlist },
  });
});

/** DELETE /wishlist/items/:productId */
export const removeWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.params as unknown as WishlistItemParamInput;
  const wishlist = await removeItemFromWishlist(
    getUserId((req as any).userId),
    productId
  );

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist",
    data: { wishlist },
  });
});
