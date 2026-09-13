import { tokenAlpha } from '@/theme/muiTheme';

/**
 * The shared look of a sidebar row.
 *
 * SidebarLearnGroup and SidebarStudyGroup are near-identical by design — one
 * per nav group — and both carried their own copy of these. That is the
 * drift risk C0 was about: a change to the active treatment had to be made in
 * two places or silently wasn't.
 *
 * MUI's ButtonBase centres its content (ButtonBase.js:53) where a plain
 * <button> does not, so `row` states the alignment rather than inheriting it.
 * Every row that reads left-to-right spreads this; the collapsed rail buttons
 * deliberately override justifyContent back to center.
 */
export const activeSx = {
  color: 'primary.main',
  bgcolor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 10),
  border: '1px solid',
  borderColor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 20),
} as const;

export const idleSx = {
  color: 'text.secondary',
  '&:hover': { color: 'text.primary', bgcolor: 'secondary.main' },
} as const;

export const row = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 1.5,
  borderRadius: 2,
  transition: 'color 200ms, background-color 200ms',
} as const;

export const disabledSx = {
  '&.Mui-disabled': {
    opacity: 0.5,
    color: 'text.secondary',
    bgcolor: 'transparent',
  },
} as const;
