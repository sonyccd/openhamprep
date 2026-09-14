import Box, { type BoxProps } from "@mui/material/Box";
import type { OverridableComponent } from "@mui/material/OverridableComponent";
import { motion, type MotionProps } from "framer-motion";

// MUI's Box forwards refs, which is what motion.create needs to drive the DOM
// node directly. Wrapping at module scope matters: creating the motion
// component inside render remounts the subtree on every render and kills the
// animation mid-flight.
//
// The cast restores Box's polymorphism, which motion.create() drops — it types
// its result from the motion side only. Without it `component` does not
// compile, so porting a <motion.p> silently demotes it to a div; with a plain
// non-generic cast `component` compiles but the host element's own attributes
// (a button's `type`) do not.
//
// OverridableComponent is the mechanism Box itself is declared with. Measured,
// rather than assumed: `component="p"` and a button's `type` both compile, and
// an unknown prop is still rejected. It is not an airtight per-element check —
// `href` on a component="button" is accepted — so treat it as restoring the
// props that were wrongly refused, not as a guarantee against wrong ones.
type MotionBoxTypeMap = {
  props: BoxProps & MotionProps;
  defaultComponent: "div";
};

export const MotionBox = motion.create(Box) as OverridableComponent<MotionBoxTypeMap>;
