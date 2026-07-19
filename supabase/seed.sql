-- Local/dev sample data. Safe to re-run: categories and products are
-- upserted by slug; product_images are only inserted for products that
-- don't have any yet.

INSERT INTO categories (name, slug, description, image_url, sort_order, is_active) VALUES
  ('Banarasi Silk', 'banarasi-silk', 'Luxurious Banarasi silk sarees with intricate zari work, perfect for weddings and special occasions.', '/images/categories/banarasi.jpg', 1, true),
  ('Kanjivaram', 'kanjivaram', 'Traditional Kanjivaram sarees from Tamil Nadu, known for their rich colors and temple borders.', '/images/categories/kanjivaram.jpg', 2, true),
  ('Chanderi', 'chanderi', 'Lightweight Chanderi sarees with a sheer texture and elegant motifs.', '/images/categories/chanderi.jpg', 3, true),
  ('Cotton', 'cotton', 'Comfortable cotton sarees ideal for daily wear and casual outings.', '/images/categories/cotton.jpg', 4, true),
  ('Georgette', 'georgette', 'Flowing georgette sarees with modern prints and embellishments.', '/images/categories/georgette.jpg', 5, true),
  ('Designer', 'designer', 'Contemporary designer sarees with unique patterns and modern aesthetics.', '/images/categories/designer.jpg', 6, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (
  title, slug, description, short_description, price, compare_at_price,
  category_id, status, is_featured, material, color, occasion, work_type
)
SELECT * FROM (VALUES
  ('Royal Banarasi Silk Wedding Saree', 'royal-banarasi-silk-wedding-saree', 'This exquisite Banarasi silk saree features intricate gold zari work with traditional motifs. The rich maroon base is complemented by a stunning pallu with detailed craftsmanship.', 'Handwoven Banarasi silk with gold zari work — perfect for weddings.', 12999.00, 18999.00, 'banarasi-silk', 'published', true, 'Pure Silk', 'Maroon & Gold', 'Wedding', 'Zari Work'),
  ('Classic Kanjivaram Temple Border Saree', 'classic-kanjivaram-temple-border-saree', 'A timeless Kanjivaram saree with the iconic temple border design, woven in deep emerald green with a contrasting gold border.', 'Traditional Kanjivaram with temple border in emerald green.', 15499.00, NULL, 'kanjivaram', 'published', true, 'Pure Silk', 'Emerald Green', 'Wedding', 'Temple Border'),
  ('Elegant Chanderi Silk Cotton Saree', 'elegant-chanderi-silk-cotton-saree', 'A lightweight Chanderi saree in soft pastel pink with delicate floral butis, ideal for day events and festive gatherings.', 'Lightweight Chanderi with floral motifs in pastel pink.', 4999.00, 6999.00, 'chanderi', 'published', true, 'Silk Cotton', 'Pastel Pink', 'Festive', 'Buti Work'),
  ('Handloom Cotton Jamdani Saree', 'handloom-cotton-jamdani-saree', 'A breezy handloom cotton saree with traditional Jamdani weaving, white base with blue geometric patterns.', 'Pure cotton handloom with Jamdani motifs — breezy and elegant.', 3499.00, NULL, 'cotton', 'published', true, 'Pure Cotton', 'White & Blue', 'Daily Wear', 'Jamdani'),
  ('Printed Georgette Party Wear Saree', 'printed-georgette-party-wear-saree', 'A stunning georgette saree with digital floral prints and a satin border, vibrant teal shade with a flowing drape.', 'Digital print georgette with satin border — party ready.', 2999.00, 4499.00, 'georgette', 'published', true, 'Georgette', 'Teal', 'Party', 'Digital Print'),
  ('Designer Sequin Embroidered Saree', 'designer-sequin-embroidered-saree', 'A contemporary designer saree with heavy sequin embroidery on a net base, midnight blue with silver sequin work.', 'Sequin embroidered net saree in midnight blue.', 8999.00, 11999.00, 'designer', 'published', true, 'Net', 'Midnight Blue', 'Party', 'Sequin Embroidery'),
  ('Banarasi Organza Floral Saree', 'banarasi-organza-floral-saree', 'A modern take on the classic Banarasi with organza fabric and floral jaal pattern, light and luxurious.', 'Organza Banarasi with floral jaal — lightweight luxury.', 7499.00, NULL, 'banarasi-silk', 'published', false, 'Organza', 'Peach', 'Festive', 'Jaal Work'),
  ('Pure Linen Handblock Print Saree', 'pure-linen-handblock-print-saree', 'A natural linen saree with traditional handblock prints in earthy tones, breathable and eco-friendly.', 'Handblock printed linen saree in earthy tones.', 4299.00, 5499.00, 'cotton', 'published', false, 'Linen', 'Earthy Brown', 'Casual', 'Block Print'),
  ('Tussar Silk Kalamkari Saree', 'tussar-silk-kalamkari-saree', 'A handpainted Kalamkari saree on luxurious Tussar silk base, featuring mythological scenes and natural dye colors.', 'Handpainted Kalamkari on Tussar silk — wearable art.', 6799.00, NULL, 'designer', 'published', true, 'Tussar Silk', 'Natural & Red', 'Festive', 'Kalamkari'),
  ('Kanjivaram Checks & Stripes Saree', 'kanjivaram-checks-stripes-saree', 'A contemporary Kanjivaram saree featuring bold checks and stripes, royal purple base with golden checks.', 'Bold checks Kanjivaram in royal purple & gold.', 13999.00, 16999.00, 'kanjivaram', 'published', false, 'Pure Silk', 'Royal Purple', 'Wedding', 'Checks & Stripes'),
  ('Chiffon Saree with Sequin Border', 'chiffon-saree-sequin-border', 'A graceful chiffon saree in soft lavender with a delicate sequin border, effortlessly glamorous for evening events.', 'Soft chiffon with sequin border in lavender.', 3299.00, NULL, 'georgette', 'published', false, 'Chiffon', 'Lavender', 'Party', 'Sequin Border'),
  ('Chanderi Zari Border Daily Wear Saree', 'chanderi-zari-border-daily-wear', 'An everyday Chanderi saree with a subtle zari border, sky blue color with a lightweight, comfortable drape.', 'Everyday Chanderi with zari border in sky blue.', 3999.00, 4999.00, 'chanderi', 'published', true, 'Chanderi', 'Sky Blue', 'Daily Wear', 'Zari Border')
) AS v(title, slug, description, short_description, price, compare_at_price, category_slug, status, is_featured, material, color, occasion, work_type)
CROSS JOIN LATERAL (SELECT id AS category_id FROM categories WHERE categories.slug = v.category_slug) c
ON CONFLICT (slug) DO NOTHING;

-- Placeholder images (picsum.photos) for any seeded product that has none yet.
INSERT INTO product_images (product_id, url, public_id, alt_text, sort_order, is_primary, width, height)
SELECT p.id, img.url, img.public_id, img.alt_text, img.sort_order, img.is_primary, 400, 533
FROM products p
CROSS JOIN LATERAL (VALUES
  ('https://picsum.photos/seed/' || p.slug || '-1/400/533', p.slug || '-1', 'Product image - front view', 0, true),
  ('https://picsum.photos/seed/' || p.slug || '-2/400/533', p.slug || '-2', 'Product image - detail view', 1, false),
  ('https://picsum.photos/seed/' || p.slug || '-3/400/533', p.slug || '-3', 'Product image - drape view', 2, false)
) AS img(url, public_id, alt_text, sort_order, is_primary)
WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_images.product_id = p.id);
