import { Types, type HydratedDocument } from "mongoose";
import { type ICart, type ICartItem } from "../models/Cart.js";
import { AppError } from "../utils/AppError.js";
import { fetchProductSnapshot } from "./product.service.js";
import type {
  AddCartItemInput,
  UpdateCartItemInput,
} from "../validators/cart.validator.js";
import { CartRepository } from "../repositories/cart.repository.js";

export interface SerializedCartItem {
  id: string;
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
}

export interface SerializedCart {
  id: string;
  items: SerializedCartItem[];
  totalItems: number;
  totalPrice: number;
}

function serializeCart(cart: HydratedDocument<ICart>): SerializedCart {
  const items = cart.items.map((item) => ({
    id: item._id.toString(),
    productId: item.productId,
    title: item.title,
    price: item.price,
    thumbnail: item.thumbnail,
    quantity: item.quantity,
  }));

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = Number(
    items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
  );

  return {
    id: cart.id as string,
    items,
    totalItems,
    totalPrice,
  };
}

async function getOrCreateCart(userId: string) {
  const existing = await CartRepository.findByUserId(userId);

  return existing ?? CartRepository.create(userId);
}

function findItem(cart: HydratedDocument<ICart>, id: string): ICartItem | undefined {
  const byItemId = Types.ObjectId.isValid(id)
    ? cart.items.find((item) => item._id.equals(id))
    : undefined;

  if (byItemId) {
    return byItemId;
  }

  const productId = Number(id);

  if (Number.isInteger(productId) && productId > 0) {
    return cart.items.find((item) => item.productId === productId);
  }

  return undefined;
}

export async function getCartForUser(userId: string) {
  const cart = await getOrCreateCart(userId);

  return serializeCart(cart);
}

export async function addItemToCart(userId: string, input: AddCartItemInput) {
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => item.productId === input.productId);

  if (existing) {
    existing.quantity += input.quantity;
  } else {
    const product = await fetchProductSnapshot(input.productId);

    cart.items.push({
      productId: product.productId,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity: input.quantity,
    } as ICartItem);
  }

  await CartRepository.save(cart);

  return serializeCart(cart);
}

export async function updateCartItemQuantity(
  userId: string,
  itemId: string,
  input: UpdateCartItemInput
) {
  const cart = await getOrCreateCart(userId);
  const item = findItem(cart, itemId);

  if (!item) {
    throw AppError.notFound("Item not in cart");
  }

  item.quantity = input.quantity;
  await CartRepository.save(cart);

  return serializeCart(cart);
}

export async function removeCartItem(userId: string, itemId: string) {
  const cart = await getOrCreateCart(userId);
  const item = findItem(cart, itemId);

  if (!item) {
    throw AppError.notFound("Item not in cart");
  }

  const index = cart.items.findIndex((cartItem) => cartItem._id.equals(item._id));
  cart.items.splice(index, 1);
  await CartRepository.save(cart);

  return serializeCart(cart);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);

  cart.items.splice(0, cart.items.length);
  await CartRepository.save(cart);

  return serializeCart(cart);
}
