import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { BulkImportQuestions } from './BulkImportQuestions';
import { BulkExport, escapeCSVField } from './BulkExport';
import { useExplanationFeedbackStats } from '@/hooks/useExplanationFeedback';
import { useAdminTopics } from '@/hooks/useTopics';
import { useQuestionMutations } from '@/hooks/useQuestionMutations';
import { useArrlChapters } from '@/hooks/useArrlChapters';
import type { LicenseType } from '@/types/chapters';
import {
  QuestionEditDialog,
  QuestionAddDialog,
  QuestionListItem,
  QuestionFiltersBar,
  TEST_TYPE_PREFIXES,
  type Question,
  type LinkData,
  type AdminQuestionsProps,
} from './questions';
import type { EditHistoryEntry } from './EditHistoryViewer';

// Map test type to license type prefix
const TEST_TYPE_TO_LICENSE: Record<AdminQuestionsProps['testType'], LicenseType> = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

export function AdminQuestions({ testType, highlightQuestionId }: AdminQuestionsProps) {
  const { data: feedbackStats = {} } = useExplanationFeedbackStats();
  const { data: allTopics = [] } = useAdminTopics();
  const { addQuestion, updateQuestion, deleteQuestion, retrySync } =
    useQuestionMutations(testType);

  // Fetch chapters for the current license type
  const licenseType = TEST_TYPE_TO_LICENSE[testType];
  const { data: chapters = [] } = useArrlChapters(licenseType);

  const [searchTerm, setSearchTerm] = useState('');
  const [showNegativeFeedbackOnly, setShowNegativeFeedbackOnly] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // New question form state
  const [newId, setNewId] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('0');
  const [newExplanation, setNewExplanation] = useState('');
  const [newFigureUrl, setNewFigureUrl] = useState<string | null>(null);

  // Edit state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState(['', '', '', '']);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('0');
  const [editExplanation, setEditExplanation] = useState('');
  const [editFigureUrl, setEditFigureUrl] = useState<string | null>(null);
  const [editForumUrl, setEditForumUrl] = useState<string | null>(null);
  const [editChapterId, setEditChapterId] = useState<string | null>(null);
  const [editPageReference, setEditPageReference] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const prefix = TEST_TYPE_PREFIXES[testType];

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin-questions', testType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select(
          `
          id, display_name, question, options, correct_answer,
          links, explanation, edit_history, figure_url, forum_url,
          discourse_sync_status, discourse_sync_at, discourse_sync_error,
          arrl_chapter_id, arrl_page_reference,
          topic_questions(topic_id)
        `
        )
        .ilike('display_name', `${prefix}%`)
        .order('display_name', { ascending: true });
      if (error) throw error;
      return data.map((q) => ({
        ...q,
        display_name: q.display_name,
        options: q.options as string[],
        links: (Array.isArray(q.links) ? q.links : []) as unknown as LinkData[],
        explanation: q.explanation,
        edit_history: (Array.isArray(q.edit_history)
          ? q.edit_history
          : []) as unknown as EditHistoryEntry[],
        figure_url: q.figure_url,
        forum_url: q.forum_url,
        discourse_sync_status: q.discourse_sync_status,
        discourse_sync_at: q.discourse_sync_at,
        discourse_sync_error: q.discourse_sync_error,
        arrl_chapter_id: q.arrl_chapter_id,
        arrl_page_reference: q.arrl_page_reference,
        linked_topic_ids: (
          (q.topic_questions as { topic_id: string }[]) || []
        ).map((tq) => tq.topic_id),
      })) as Question[];
    },
  });

  // Auto-open edit dialog when highlightQuestionId is set
  useEffect(() => {
    if (highlightQuestionId && questions.length > 0) {
      const question = questions.find((q) => q.display_name === highlightQuestionId);
      if (question) {
        handleEditClick(question);
      }
    }
  }, [highlightQuestionId, questions]);

  const resetForm = () => {
    setNewId('');
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setNewCorrectAnswer('0');
    setNewExplanation('');
    setNewFigureUrl(null);
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNegativeFeedback =
      !showNegativeFeedbackOnly ||
      (feedbackStats[q.display_name] &&
        feedbackStats[q.display_name].notHelpful >
          feedbackStats[q.display_name].helpful);
    return matchesSearch && matchesNegativeFeedback;
  });

  const handleAddQuestion = () => {
    if (!newId.trim() || !newQuestion.trim() || newOptions.some((o) => !o.trim())) {
      toast.error('Please fill in all fields');
      return;
    }
    addQuestion.mutate(
      {
        id: '',
        display_name: newId,
        question: newQuestion,
        options: newOptions.map((o) => o.trim()),
        correct_answer: parseInt(newCorrectAnswer),
        explanation: newExplanation,
        links: [],
        figure_url: newFigureUrl,
      },
      {
        onSuccess: () => {
          resetForm();
          setIsAddDialogOpen(false);
        },
      }
    );
  };

  const handleEditClick = (q: Question) => {
    setEditingQuestion(q);
    setEditQuestion(q.question);
    setEditOptions([...q.options]);
    setEditCorrectAnswer(q.correct_answer.toString());
    setEditExplanation(q.explanation || '');
    setEditFigureUrl(q.figure_url || null);
    setEditForumUrl(q.forum_url || null);
    setEditChapterId(q.arrl_chapter_id || null);
    setEditPageReference(q.arrl_page_reference || null);
  };

  const getLinkedTopicNames = (topicIds: string[] | undefined) => {
    if (!topicIds || topicIds.length === 0) return [];
    return allTopics.filter((t) => topicIds.includes(t.id)).map((t) => t.title);
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion || !editQuestion.trim() || editOptions.some((o) => !o.trim())) {
      toast.error('Please fill in all fields');
      return;
    }
    updateQuestion.mutate(
      {
        question: {
          id: editingQuestion.id,
          display_name: editingQuestion.display_name,
          question: editQuestion,
          options: editOptions.map((o) => o.trim()),
          correct_answer: parseInt(editCorrectAnswer),
          explanation: editExplanation,
          figure_url: editFigureUrl,
          forum_url: editForumUrl?.trim() || null,
          arrl_chapter_id: editChapterId,
          arrl_page_reference: editPageReference?.trim() || null,
        },
        originalQuestion: editingQuestion,
      },
      {
        onSuccess: () => setEditingQuestion(null),
      }
    );
  };

  const handleDeleteQuestion = () => {
    if (editingQuestion) {
      deleteQuestion.mutate(editingQuestion.id, {
        onSuccess: () => setEditingQuestion(null),
      });
    }
  };

  const handleRetrySync = (displayName: string) => {
    const question = questions.find((q) => q.display_name === displayName);
    if (question) {
      retrySync(question);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <QuestionEditDialog
        question={editingQuestion}
        highlightQuestionId={highlightQuestionId}
        editQuestion={editQuestion}
        editOptions={editOptions}
        editCorrectAnswer={editCorrectAnswer}
        editExplanation={editExplanation}
        editFigureUrl={editFigureUrl}
        editForumUrl={editForumUrl}
        editChapterId={editChapterId}
        editPageReference={editPageReference}
        chapters={chapters}
        linkedTopicNames={getLinkedTopicNames(editingQuestion?.linked_topic_ids)}
        isDeleteDialogOpen={isDeleteDialogOpen}
        isUpdatePending={updateQuestion.isPending}
        onClose={() => setEditingQuestion(null)}
        onQuestionChange={setEditQuestion}
        onOptionChange={(index, value) => {
          const updated = [...editOptions];
          updated[index] = value;
          setEditOptions(updated);
        }}
        onCorrectAnswerChange={setEditCorrectAnswer}
        onExplanationChange={setEditExplanation}
        onFigureUrlChange={setEditFigureUrl}
        onForumUrlChange={setEditForumUrl}
        onChapterIdChange={setEditChapterId}
        onPageReferenceChange={setEditPageReference}
        onDeleteDialogOpenChange={setIsDeleteDialogOpen}
        onUpdate={handleUpdateQuestion}
        onDelete={handleDeleteQuestion}
      />

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {testType.charAt(0).toUpperCase() + testType.slice(1)} Questions (
              {questions.length})
            </span>
            <div className="flex items-center gap-2">
              <BulkExport
                data={questions}
                filename={`${testType}_questions`}
                itemLabel="questions"
                formatCSV={(items) => {
                  const header =
                    'display_name,question,option_a,option_b,option_c,option_d,correct_answer,explanation';
                  const rows = items.map((q) =>
                    [
                      escapeCSVField(q.display_name),
                      escapeCSVField(q.question),
                      escapeCSVField(q.options[0]),
                      escapeCSVField(q.options[1]),
                      escapeCSVField(q.options[2]),
                      escapeCSVField(q.options[3]),
                      ['A', 'B', 'C', 'D'][q.correct_answer],
                      escapeCSVField(q.explanation || ''),
                    ].join(',')
                  );
                  return [header, ...rows].join('\n');
                }}
                formatJSON={(items) =>
                  items.map((q) => ({
                    id: q.id,
                    display_name: q.display_name,
                    question: q.question,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation || null,
                    links: q.links || [],
                  }))
                }
              />
              <BulkImportQuestions testType={testType} />
              <QuestionAddDialog
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                newId={newId}
                newQuestion={newQuestion}
                newOptions={newOptions}
                newCorrectAnswer={newCorrectAnswer}
                newExplanation={newExplanation}
                newFigureUrl={newFigureUrl}
                isPending={addQuestion.isPending}
                onIdChange={setNewId}
                onQuestionChange={setNewQuestion}
                onOptionChange={(index, value) => {
                  const updated = [...newOptions];
                  updated[index] = value;
                  setNewOptions(updated);
                }}
                onCorrectAnswerChange={setNewCorrectAnswer}
                onExplanationChange={setNewExplanation}
                onFigureUrlChange={setNewFigureUrl}
                onAdd={handleAddQuestion}
              />
            </div>
          </CardTitle>
          <QuestionFiltersBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showNegativeFeedbackOnly={showNegativeFeedbackOnly}
            onNegativeFeedbackChange={setShowNegativeFeedbackOnly}
            filteredCount={filteredQuestions.length}
          />
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3 h-full overflow-y-auto pb-4">
              {filteredQuestions.map((q) => (
                <QuestionListItem
                  key={q.id}
                  question={q}
                  isHighlighted={highlightQuestionId === q.display_name}
                  feedbackStats={feedbackStats[q.display_name]}
                  onEdit={() => handleEditClick(q)}
                  onRetrySync={() => handleRetrySync(q.display_name)}
                />
              ))}
              {filteredQuestions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {searchTerm ? 'No matching questions found' : 'No questions found'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
