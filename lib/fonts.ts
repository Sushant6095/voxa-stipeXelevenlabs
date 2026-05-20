/**
 * Voxa font stack — exported as Next.js font objects so consumers can
 * apply the `.variable` className on `<html>` / `<body>`.
 *
 * - Geist Sans  → body text
 * - Geist Mono  → numbers, code, phone numbers
 * - Cal Sans    → hero headlines ONLY (display)
 */
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";

/** Body sans — exposes `--font-geist-sans`. */
export const geistSans = GeistSans;

/** Mono — exposes `--font-geist-mono`. */
export const geistMono = GeistMono;

/**
 * Cal Sans display font — exposes `--font-cal`.
 * The upstream `calcom/sans` repo now ships only `CalSans-Regular` as a
 * single-weight display face; we save it on disk as `CalSans-SemiBold.woff2`
 * because Cal Sans is visually a semi-bold display weight.
 */
export const calSans = localFont({
  src: "../public/fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal",
  display: "swap",
  weight: "600",
});
