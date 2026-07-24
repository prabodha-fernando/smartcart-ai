import process from "process";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User, hashEmail } from "../src/models/User.js";
import { Product, type IProduct } from "../src/models/Product.js";
import { Category } from "../src/models/Category.js";

const DEMO_USER = {
  name: "Emily Johnson",
  email: "emily.johnson@smartcart.local",
  password: "emilyspass",
};

const DUMMYJSON_URL = "https://dummyjson.com";

interface RawCatalogProduct extends Partial<IProduct> {
  id: number;
  title: string;
  category: string;
  price: number;
}

/** Maps a raw catalog record onto our Product schema, filling safe defaults. */
function normalizeCatalogProduct(raw: RawCatalogProduct): IProduct {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? "",
    category: raw.category,
    price: raw.price,
    discountPercentage: raw.discountPercentage ?? 0,
    rating: raw.rating ?? 0,
    stock: raw.stock ?? 0,
    brand: raw.brand,
    tags: raw.tags ?? [],
    weight: raw.weight ?? 0,
    dimensions: raw.dimensions ?? { width: 0, height: 0, depth: 0 },
    warrantyInformation: raw.warrantyInformation ?? "",
    shippingInformation: raw.shippingInformation ?? "",
    availabilityStatus: raw.availabilityStatus ?? "In Stock",
    reviews: raw.reviews ?? [],
    returnPolicy: raw.returnPolicy ?? "",
    minimumOrderQuantity: raw.minimumOrderQuantity ?? 1,
    images: raw.images ?? [],
    thumbnail: raw.thumbnail ?? "",
  };
}

async function seed() {
  await connectDB();

  const existing = await User.findOne({ emailHash: hashEmail(DEMO_USER.email) });
  if (existing) {
    console.log(`✓ Demo user "${DEMO_USER.email}" already exists - skipping.`);
  } else {
    await User.create(DEMO_USER);
    console.log(
      `✓ Created demo user "${DEMO_USER.email}" (password: ${DEMO_USER.password}).`
    );
  }

  const productCount = await Product.countDocuments();
  if (productCount > 0) {
    console.log(`✓ Skipping product seed — ${productCount} products already exist.`);
  } else {
    console.log("… Fetching product catalog from DummyJSON");
    const res = await fetch(`${DUMMYJSON_URL}/products?limit=200&skip=0`);
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
    const data = await res.json();
    const rawProducts = data.products as RawCatalogProduct[];
    const catalog = rawProducts.map(normalizeCatalogProduct);

    await Product.bulkWrite(
      catalog.map((product) => ({
        updateOne: {
          filter: { id: product.id },
          update: { $set: product },
          upsert: true,
        },
      }))
    );
    console.log(`✓ Imported ${catalog.length} products into MongoDB.`);
  }

  const categoryCount = await Category.countDocuments();
  if (categoryCount > 0) {
    console.log(`✓ Skipping category seed — ${categoryCount} categories already exist.`);
  } else {
    console.log("… Fetching categories from DummyJSON");
    const res = await fetch(`${DUMMYJSON_URL}/products/categories`);
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
    const categories = await res.json();

    await Category.bulkWrite(
      categories.map((c: any) => ({
        updateOne: {
          filter: { slug: c.slug },
          update: {
            $set: {
              slug: c.slug,
              name: c.name,
              url: `/api/products/category/${c.slug}`,
            },
          },
          upsert: true,
        },
      }))
    );
    console.log(`✓ Imported ${categories.length} categories into MongoDB.`);
  }

  await disconnectDB();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  await disconnectDB();
  process.exit(1);
});
