import { z } from "zod";

/** Accept safe local uploads as well as hosted HTTP(S) product images. */
export const productImageUrl = z.string().refine(
  (value) => {
    if (
      value.startsWith("/uploads/") &&
      !value.includes("\\") &&
      !value.split("/").includes("..")
    ) {
      return true;
    }

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "Image must be a local upload path or an HTTP(S) URL." },
);
