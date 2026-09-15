import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import {
  EMPTY_RESOURCE_DRAFT,
  rejectResourceFile,
  titleFromFileName,
  type ResourceDraft,
} from './resourceDraft';

interface UseAddResourceFormOptions {
  /** Drives the reset: the draft clears whenever the dialog opens. */
  open: boolean;
  onSubmit: (draft: ResourceDraft, file: File | null) => void;
}

/**
 * The add dialog's draft, its chosen file, and the rules tying the two
 * together.
 *
 * The draft used to clear only after a successful save, so cancelling and
 * reopening showed the abandoned entry. It clears on open instead.
 *
 * Unlike #302's leak, the choice of open over close is cosmetic here: this is
 * an effect keyed on `open`, which fires on every close path including the one
 * a mutation triggers, so clearing on close would be correct too — it would
 * just blank the form in view during the dialog's exit animation. What matters
 * is that it no longer hangs off success alone.
 *
 * Clearing on open also leaves a failed save alone: the dialog stays up with
 * what was typed still in it.
 */
export function useAddResourceForm({ open, onSubmit }: UseAddResourceFormOptions) {
  const [draft, setDraft] = useState<ResourceDraft>(EMPTY_RESOURCE_DRAFT);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (open) {
      setDraft(EMPTY_RESOURCE_DRAFT);
      clearFile();
    }
  }, [open]);

  const changeDraft = (next: ResourceDraft) => {
    // Changing the type changes what the picker accepts, so a file chosen
    // under the old type cannot be carried over.
    if (next.type !== draft.type) clearFile();
    setDraft(next);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    if (!chosen) return;

    const rejection = rejectResourceFile(chosen, draft.type);
    if (rejection) {
      toast.error(rejection);
      event.target.value = '';
      return;
    }

    setFile(chosen);
    // An upload can name the resource when nothing has been typed.
    if (!draft.title.trim()) {
      setDraft((current) => ({ ...current, title: titleFromFileName(chosen.name) }));
    }
  };

  const submit = () => {
    if (!draft.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!draft.url.trim() && !file) {
      toast.error('Please provide a URL or upload a file');
      return;
    }
    onSubmit(draft, file);
  };

  return { draft, changeDraft, file, clearFile, fileInputRef, handleFileSelect, submit };
}
