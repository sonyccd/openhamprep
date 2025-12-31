import type { EditHistoryEntry } from '../EditHistoryViewer';

export interface LinkData {
  url: string;
  title: string;
  description: string;
  image: string;
  type: 'video' | 'article' | 'website';
  siteName: string;
  unfurledAt?: string;
}

export interface Question {
  id: string;  // UUID
  display_name: string;  // Human-readable ID (T1A01, etc.) - set by FCC
  question: string;
  options: string[];
  correct_answer: number;
  links?: LinkData[];
  explanation?: string | null;
  edit_history?: EditHistoryEntry[];
  figure_url?: string | null;
  forum_url?: string | null;
  discourse_sync_status?: string | null;
  discourse_sync_at?: string | null;
  discourse_sync_error?: string | null;
  linked_topic_ids?: string[];
}

export interface AdminQuestionsProps {
  testType: 'technician' | 'general' | 'extra';
  highlightQuestionId?: string;
}

export const TEST_TYPE_PREFIXES: Record<AdminQuestionsProps['testType'], string> = {
  technician: 'T',
  general: 'G',
  extra: 'E'
};
