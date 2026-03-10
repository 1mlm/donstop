import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "../styles/globals.css";
import type { PropsWithChildren } from "react";
import { cn } from "@/shadcn/lib/utils";

const outfit = Outfit();

export const metadata: Metadata = {
  title: "DonStop",
  description:
    "An addictive web app to help you stop procrastinating and get things done.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className={cn(outfit.className, "antialiased")}>
      <body>{children}</body>
    </html>
  );
}
