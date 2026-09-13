import Box, { type BoxProps } from "@mui/material/Box";
import { motion, type MotionProps } from "framer-motion";

// MUI's Box forwards refs, which is what motion.create needs to drive the DOM
// node directly. Wrapping at module scope matters: creating the motion
// component inside render remounts the subtree on every render and kills the
// animation mid-flight.
//
// The cast restores Box's own props. motion.create() types its result from the
// motion side only, so `component` — Box's polymorphic escape hatch — is
// rejected by TypeScript even though it passes straight through at runtime.
// Without this, porting a <motion.p> to MotionBox silently demotes it to a div,
// because the one prop that would keep it a paragraph does not compile.
export const MotionBox = motion.create(Box) as React.ComponentType<BoxProps & MotionProps>;
