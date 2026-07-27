import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  addItemToWishlist,
  getWishlistForUser,
  removeItemFromWishlist,
} from "../services/wishlist.service.js";
import type {
  AddWishlistItemInput,
  WishlistItemParamInput,
} from "../validators/wishlist.validator.js";

function getUserId(userId?: string) {
  if (!userId) {
    throw ApiError.unauthorized("Unauthorized");
  }

  return userId;
}

/** GET /wishlist */
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getWishlistForUser(getUserId(req.userId));

  res.status(200).json({
    success: true,
    message: "Wishlist fetched successfully",
    data: { wishlist },
  });
});

/** POST /wishlist/items */
export const addWishlistItem = asyncHandler(async (req, res) => {
  const wishlist = await addItemToWishlist(
    getUserId(req.userId),
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
    getUserId(req.userId),
    productId
  );

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist",
    data: { wishlist },
  });
});
