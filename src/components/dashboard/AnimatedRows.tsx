"use client";

import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};

const row: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
};

export function AnimatedTbody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.tbody
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.tbody>
  );
}

export function AnimatedTr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.tr variants={row} className={className}>
      {children}
    </motion.tr>
  );
}
