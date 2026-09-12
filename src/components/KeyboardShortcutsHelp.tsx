import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Answering Questions',
    shortcuts: [
      { keys: ['A'], description: 'Select answer A' },
      { keys: ['B'], description: 'Select answer B' },
      { keys: ['C'], description: 'Select answer C' },
      { keys: ['D'], description: 'Select answer D' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['→'], description: 'Next question' },
      { keys: ['←'], description: 'Previous question' },
      { keys: ['S'], description: 'Skip question (Random Practice)' },
      { keys: ['Esc'], description: 'Go back / Close' },
    ],
  },
  {
    title: 'Tools',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
];

// The <kbd> chrome, shared by the list and the footer hint.
const kbd = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  height: 24,
  px: 1,
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  fontWeight: 500,
  bgcolor: 'muted',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
} as const;

interface KeyboardShortcutsHelpProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function KeyboardShortcutsHelp({
  open: controlledOpen,
  onOpenChange,
  showTrigger = true
}: KeyboardShortcutsHelpProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  // Listen for ? key to open help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  return (
    <>
      {/*
        MUI has no DialogTrigger — the dialog is opened by whatever owns `open`.
        So the trigger is a plain button rather than the
        Tooltip > DialogTrigger > Button nesting this replaces.
      */}
      {showTrigger && (
        <Tooltip title="Keyboard shortcuts (?)">
          <IconButton
            onClick={() => setOpen(true)}
            aria-label="Keyboard shortcuts"
            sx={{ width: 32, height: 32, color: 'text.secondary' }}
          >
            <Box component={Keyboard} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      {/*
        onClose fires for both the backdrop and Escape, which is what
        Radix's onOpenChange(false) covered. The z-[100] the old
        DialogContent carried is gone: MUI puts modals at zIndex 1300 by
        default, well clear of anything this app stacks.
      */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-describedby="shortcuts-description"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component={Keyboard} aria-hidden="true" sx={{ width: 20, height: 20 }} />
          Keyboard Shortcuts
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="shortcuts-description">
            Use these keyboard shortcuts to navigate and answer questions faster.
          </DialogContentText>

          <Stack spacing={3} sx={{ py: 2 }}>
            {shortcutGroups.map((group) => (
              <Box key={group.title}>
                <Typography
                  variant="subtitle2"
                  component="h3"
                  sx={{ fontWeight: 500, color: 'text.secondary', mb: 1.5 }}
                >
                  {group.title}
                </Typography>
                <Stack spacing={1}>
                  {group.shortcuts.map((shortcut, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.75,
                      }}
                    >
                      <Typography variant="body2">{shortcut.description}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {shortcut.keys.map((key, keyIndex) => (
                          <Box component="kbd" key={keyIndex} sx={kbd}>
                            {key}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>

          <Box
            sx={{
              textAlign: 'center',
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            Press{' '}
            <Box component="kbd" sx={{ ...kbd, minWidth: 'auto', height: 'auto', py: 0.25 }}>
              ?
            </Box>{' '}
            anytime to show this help
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
