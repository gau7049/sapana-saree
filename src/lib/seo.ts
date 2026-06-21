import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "./constants";

export function createMetadata({
  title,
  description,
  path = "",
  image,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullDescription = description ?? SITE_DESCRIPTION;
  const url = `${SITE_URL}${path}`;

  return {
    title: fullTitle,
    description: fullDescription,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(image && {
        images: [{ url: image, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      ...(image && { images: [image] }),
    },
  };
}
