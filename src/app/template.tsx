"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Re-mounts on every route change, giving each page a soft fade-in.
// Opacity only — a transform here would break the sticky Navbar.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
