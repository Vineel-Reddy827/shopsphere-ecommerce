/** Validation for the Add Product form. Returns { ok, errors, value }. */
import { isValidImageUrl } from './helpers.js';

export function validateProduct(input) {
  const errors = {};
  const title = String(input.title ?? '').trim();
  const category = String(input.category ?? '').trim();
  const description = String(input.description ?? '').trim();
  const image = String(input.image ?? '').trim();
  const price = Number(input.price);

  if (title.length < 3) errors.title = 'Title is required (min 3 characters).';
  if (!category) errors.category = 'Category is required.';
  if (!Number.isFinite(price) || price <= 0) errors.price = 'Price must be a positive number.';
  if (price > 100000) errors.price = 'Price looks unrealistic (max $100,000).';
  if (!image) errors.image = 'Image URL is required so the product always renders an image.';
  else if (!isValidImageUrl(image)) errors.image = 'Enter a valid http(s) image URL (png/jpg/webp/svg) or picsum.photos URL.';
  if (description && description.length < 10) errors.description = 'Description should be at least 10 characters if provided.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: {},
    value: {
      title,
      price: Math.round(price * 100) / 100,
      category: category.toLowerCase(),
      description: description || `${title} — quality product from the Task-6 catalog.`,
      image,
      rating: { rate: 0, count: 0 }
    }
  };
}
