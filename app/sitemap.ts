import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/dostify/site";

/** Bump when the landing page content changes meaningfully. */
const LANDING_UPDATED = new Date("2026-11-19");

/** Sign-in and sign-up are listed so people searching "Dostify login" land there. The app itself is private. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: LANDING_UPDATED, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/sign-up`, lastModified: LANDING_UPDATED, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/sign-in`, lastModified: LANDING_UPDATED, changeFrequency: "yearly", priority: 0.4 },
  ];
}
