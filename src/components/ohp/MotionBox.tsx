import Box from "@mui/material/Box";
import { motion } from "framer-motion";

// MUI's Box forwards refs, which is what motion.create needs to drive the DOM
// node directly. Wrapping at module scope matters: creating the motion
// component inside render remounts the subtree on every render and kills the
// animation mid-flight.
export const MotionBox = motion.create(Box);
