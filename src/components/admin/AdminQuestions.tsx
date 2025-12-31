import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Search, Loader2, Pencil, Link as LinkIcon, ExternalLink, ThumbsUp, ThumbsDown, X, Image, BookOpen } from "lucide-react";
import { BulkImportQuestions } from "./BulkImportQuestions";
import { BulkExport, escapeCSVField } from "./BulkExport";
import { EditHistoryViewer, EditHistoryEntry } from "./EditHistoryViewer";
import { Checkbox } from "@/components/ui/checkbox";
import { useExplanationFeedbackStats } from "@/hooks/useExplanationFeedback";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FigureUpload } from "./FigureUpload";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { useAdminTopics } from "@/hooks/useTopics";
import { getSafeUrl } from "@/lib/utils";

interface LinkData {
  url: string;
  title: string;
  description: string;
  image: string;
  type: 'video' | 'article' | 'website';
  siteName: string;
  unfurledAt?: string;
}
interface Question {
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
interface AdminQuestionsProps {
  testType: 'technician' | 'general' | 'extra';
  highlightQuestionId?: string;
}
const TEST_TYPE_PREFIXES = {
  technician: 'T',
  general: 'G',
  extra: 'E'
};
export function AdminQuestions({
  testType,
  highlightQuestionId
}: AdminQuestionsProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    data: feedbackStats = {}
  } = useExplanationFeedbackStats();
  const { data: allTopics = [] } = useAdminTopics();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNegativeFeedbackOnly, setShowNegativeFeedbackOnly] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // New question form state
  const [newId, setNewId] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("0");
  const [newExplanation, setNewExplanation] = useState("");
  const [newFigureUrl, setNewFigureUrl] = useState<string | null>(null);

  // Edit state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editOptions, setEditOptions] = useState(["", "", "", ""]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState("0");
  const [editExplanation, setEditExplanation] = useState("");
  const [editFigureUrl, setEditFigureUrl] = useState<string | null>(null);
  const [editForumUrl, setEditForumUrl] = useState<string | null>(null);
  const prefix = TEST_TYPE_PREFIXES[testType];

  const {
    data: questions = [],
    isLoading
  } = useQuery({
    queryKey: ['admin-questions', testType],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('questions')
        .select(`
          id, display_name, question, options, correct_answer,
          links, explanation, edit_history, figure_url, forum_url,
          discourse_sync_status, discourse_sync_at, discourse_sync_error,
          topic_questions(topic_id)
        `)
        .ilike('display_name', `${prefix}%`)
        .order('display_name', { ascending: true });
      if (error) throw error;
      return data.map(q => ({
        ...q,
        display_name: q.display_name,
        options: q.options as string[],
        links: (Array.isArray(q.links) ? q.links : []) as unknown as LinkData[],
        explanation: q.explanation,
        edit_history: (Array.isArray(q.edit_history) ? q.edit_history : []) as unknown as EditHistoryEntry[],
        figure_url: q.figure_url,
        forum_url: q.forum_url,
        discourse_sync_status: q.discourse_sync_status,
        discourse_sync_at: q.discourse_sync_at,
        discourse_sync_error: q.discourse_sync_error,
        linked_topic_ids: (q.topic_questions as { topic_id: string }[] || []).map(tq => tq.topic_id)
      })) as Question[];
    }
  });

  // Auto-open edit dialog when highlightQuestionId is set
  useEffect(() => {
    if (highlightQuestionId && questions.length > 0) {
      const question = questions.find(q => q.display_name === highlightQuestionId);
      if (question) {
        handleEditClick(question);
      }
    }
  }, [highlightQuestionId, questions]);
  const addQuestion = useMutation({
    mutationFn: async (question: Omit<Question, 'edit_history'> & { links: LinkData[]; explanation?: string; figure_url?: string | null }) => {
      const historyEntry: EditHistoryEntry = {
        user_id: user?.id || '',
        user_email: user?.email || 'Unknown',
        action: 'created',
        changes: {},
        timestamp: new Date().toISOString(),
      };

      const displayName = question.display_name.trim().toUpperCase();
      const {
        error
      } = await supabase.from('questions').insert({
        display_name: displayName,
        question: question.question.trim(),
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation?.trim() || null,
        links: [], // Links are now extracted from explanation
        edit_history: JSON.parse(JSON.stringify([historyEntry])),
        figure_url: question.figure_url || null
      });
      if (error) throw error;

      // Extract links from explanation and unfurl them
      if (question.explanation?.trim()) {
        try {
          await supabase.functions.invoke('manage-question-links', {
            body: {
              action: 'extract-from-explanation',
              questionId: displayName  // Edge function accepts display_name for lookup
            }
          });
        } catch (linkError) {
          console.warn('Failed to extract links from explanation:', linkError);
          // Non-fatal - don't show error to user
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-questions-full']
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-stats-questions']
      });
      queryClient.invalidateQueries({
        queryKey: ['questions']
      });
      resetForm();
      setIsAddDialogOpen(false);
      toast.success("Question added successfully");
    },
    onError: error => {
      toast.error("Failed to add question: " + error.message);
    }
  });
  const updateQuestion = useMutation({
    mutationFn: async (params: { question: Question & { explanation?: string | null; figure_url?: string | null; forum_url?: string | null }; originalQuestion: Question }) => {
      const { question, originalQuestion } = params;

      // Build changes object
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (originalQuestion.question !== question.question.trim()) {
        changes.question = { from: originalQuestion.question, to: question.question.trim() };
      }
      if (JSON.stringify(originalQuestion.options) !== JSON.stringify(question.options)) {
        changes.options = { from: originalQuestion.options, to: question.options };
      }
      if (originalQuestion.correct_answer !== question.correct_answer) {
        changes.correct_answer = { from: originalQuestion.correct_answer, to: question.correct_answer };
      }
      if ((originalQuestion.explanation || '') !== (question.explanation?.trim() || '')) {
        changes.explanation = { from: originalQuestion.explanation || '', to: question.explanation?.trim() || '' };
      }
      if ((originalQuestion.figure_url || '') !== (question.figure_url || '')) {
        changes.figure_url = { from: originalQuestion.figure_url || '', to: question.figure_url || '' };
      }
      if ((originalQuestion.forum_url || '') !== (question.forum_url || '')) {
        changes.forum_url = { from: originalQuestion.forum_url || '', to: question.forum_url || '' };
      }

      const historyEntry: EditHistoryEntry = {
        user_id: user?.id || '',
        user_email: user?.email || 'Unknown',
        action: 'updated',
        changes,
        timestamp: new Date().toISOString(),
      };

      const existingHistory = originalQuestion.edit_history || [];

      const {
        error
      } = await supabase.from('questions').update({
        question: question.question.trim(),
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation?.trim() || null,
        figure_url: question.figure_url || null,
        forum_url: question.forum_url || null,
        edit_history: JSON.parse(JSON.stringify([...existingHistory, historyEntry]))
      }).eq('id', question.id);
      if (error) throw error;

      // If explanation changed and question has forum_url (either original or newly set), sync to Discourse
      const explanationChanged = (originalQuestion.explanation || '') !== (question.explanation?.trim() || '');
      const effectiveForumUrl = question.forum_url || originalQuestion.forum_url;
      if (explanationChanged && effectiveForumUrl) {
        try {
          // Set pending status
          await supabase.from('questions').update({
            discourse_sync_status: 'pending',
            discourse_sync_at: new Date().toISOString()
          }).eq('id', question.id);

          // Call edge function to update Discourse
          const response = await supabase.functions.invoke('update-discourse-post', {
            body: {
              questionId: question.id,
              explanation: question.explanation?.trim() || ''
            }
          });

          if (response.error) {
            console.error('Discourse sync failed:', response.error);
            // Update status to error - edge function may not have done it
            const errorMessage = response.error.message || 'Sync failed';
            await supabase.from('questions').update({
              discourse_sync_status: 'error',
              discourse_sync_at: new Date().toISOString(),
              discourse_sync_error: errorMessage
            }).eq('id', question.id);
          }
        } catch (syncError) {
          console.error('Failed to sync to Discourse:', syncError);
          // Update status to error
          const errorMessage = syncError instanceof Error ? syncError.message : 'Sync failed';
          await supabase.from('questions').update({
            discourse_sync_status: 'error',
            discourse_sync_at: new Date().toISOString(),
            discourse_sync_error: errorMessage
          }).eq('id', question.id);
        }
      }

      // Extract links from explanation and unfurl them
      if (explanationChanged || !originalQuestion.explanation) {
        try {
          await supabase.functions.invoke('manage-question-links', {
            body: {
              action: 'extract-from-explanation',
              questionId: question.id
            }
          });
        } catch (linkError) {
          console.warn('Failed to extract links from explanation:', linkError);
          // Non-fatal - don't show error to user
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-questions-full']
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-stats-questions']
      });
      queryClient.invalidateQueries({
        queryKey: ['questions']
      });
      setEditingQuestion(null);
      toast.success("Question updated successfully");
    },
    onError: error => {
      toast.error("Failed to update question: " + error.message);
    }
  });
  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-questions-full']
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-stats-questions']
      });
      queryClient.invalidateQueries({
        queryKey: ['questions']
      });
      setEditingQuestion(null);
      toast.success("Question deleted successfully");
    },
    onError: error => {
      toast.error("Failed to delete question: " + error.message);
    }
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Retry syncing explanation to Discourse
  // Note: questionId here is the display_name (T1A01 format) for user-facing operations
  const handleRetrySync = async (displayName: string) => {
    const question = questions.find(q => q.display_name === displayName);
    if (!question?.forum_url) {
      toast.error("Question has no Discourse topic");
      return;
    }

    try {
      // Set pending status first (use UUID for database update)
      await supabase.from('questions').update({
        discourse_sync_status: 'pending',
        discourse_sync_at: new Date().toISOString()
      }).eq('id', question.id);

      // Invalidate to show pending state
      queryClient.invalidateQueries({ queryKey: ['admin-questions', testType] });

      const response = await supabase.functions.invoke('update-discourse-post', {
        body: {
          questionId: displayName,  // Edge function accepts display_name
          explanation: question.explanation || ''
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success('Synced to Discourse successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-questions', testType] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Sync failed: ' + errorMessage);

      // Update status to error as fallback (in case edge function didn't update it)
      await supabase.from('questions').update({
        discourse_sync_status: 'error',
        discourse_sync_at: new Date().toISOString(),
        discourse_sync_error: errorMessage
      }).eq('id', question.id);

      queryClient.invalidateQueries({ queryKey: ['admin-questions', testType] });
    }
  };

  const resetForm = () => {
    setNewId("");
    setNewQuestion("");
    setNewOptions(["", "", "", ""]);
    setNewCorrectAnswer("0");
    setNewExplanation("");
    setNewFigureUrl(null);
  };
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNegativeFeedback = !showNegativeFeedbackOnly ||
      (feedbackStats[q.display_name] && feedbackStats[q.display_name].notHelpful > feedbackStats[q.display_name].helpful);
    return matchesSearch && matchesNegativeFeedback;
  });
  const handleAddQuestion = () => {
    if (!newId.trim() || !newQuestion.trim() || newOptions.some(o => !o.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    addQuestion.mutate({
      id: '',  // UUID will be auto-generated by database
      display_name: newId,
      question: newQuestion,
      options: newOptions.map(o => o.trim()),
      correct_answer: parseInt(newCorrectAnswer),
      explanation: newExplanation,
      links: [], // Links are now extracted from explanation
      figure_url: newFigureUrl
    });
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...newOptions];
    updated[index] = value;
    setNewOptions(updated);
  };
  const handleEditClick = (q: Question) => {
    setEditingQuestion(q);
    setEditQuestion(q.question);
    setEditOptions([...q.options]);
    setEditCorrectAnswer(q.correct_answer.toString());
    setEditExplanation(q.explanation || "");
    setEditFigureUrl(q.figure_url || null);
    setEditForumUrl(q.forum_url || null);
  };

  // Get topic names for linked topics display
  const getLinkedTopicNames = (topicIds: string[] | undefined) => {
    if (!topicIds || topicIds.length === 0) return [];
    return allTopics.filter(t => topicIds.includes(t.id)).map(t => t.title);
  };
  const updateEditOption = (index: number, value: string) => {
    const updated = [...editOptions];
    updated[index] = value;
    setEditOptions(updated);
  };
  const handleUpdateQuestion = () => {
    if (!editingQuestion || !editQuestion.trim() || editOptions.some(o => !o.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    updateQuestion.mutate({
      question: {
        id: editingQuestion.id,
        display_name: editingQuestion.display_name,
        question: editQuestion,
        options: editOptions.map(o => o.trim()),
        correct_answer: parseInt(editCorrectAnswer),
        explanation: editExplanation,
        figure_url: editFigureUrl,
        forum_url: editForumUrl?.trim() || null
      },
      originalQuestion: editingQuestion
    });
  };
  return <div className="flex flex-col flex-1 min-h-0">
      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={open => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Question: {editingQuestion?.display_name}
              {highlightQuestionId === editingQuestion?.display_name && <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
                  From Stats
                </Badge>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Question Text</Label>
              <Textarea placeholder="Enter the question..." value={editQuestion} onChange={e => setEditQuestion(e.target.value)} rows={3} />
            </div>
            
            <div className="space-y-3">
              <Label>Options</Label>
              {['A', 'B', 'C', 'D'].map((letter, index) => <div key={letter} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-mono">
                    {letter}
                  </span>
                  <Input placeholder={`Option ${letter}`} value={editOptions[index]} onChange={e => updateEditOption(index, e.target.value)} />
                </div>)}
            </div>
            
            <div>
              <Label>Correct Answer</Label>
              <Select value={editCorrectAnswer} onValueChange={setEditCorrectAnswer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">A</SelectItem>
                  <SelectItem value="1">B</SelectItem>
                  <SelectItem value="2">C</SelectItem>
                  <SelectItem value="3">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Explanation Section */}
            <div>
              <Label>Explanation (shown after answering)</Label>
              <Textarea placeholder="Explain why this is the correct answer..." value={editExplanation} onChange={e => setEditExplanation(e.target.value)} rows={4} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                This explanation will be shown to users after they answer the question.
              </p>
            </div>

            <Separator />

            {/* Figure Section */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Question Figure (Optional)
              </Label>
              <FigureUpload
                questionId={editingQuestion?.id || ''}
                currentFigureUrl={editFigureUrl}
                onUpload={(url) => setEditFigureUrl(url)}
                onRemove={() => setEditFigureUrl(null)}
              />
            </div>

            <Separator />

            {/* Learning Resources Info */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Learning Resources
              </Label>
              <p className="text-sm text-muted-foreground">
                Links are automatically extracted from the explanation. Use markdown syntax: <code className="px-1 py-0.5 rounded bg-muted text-xs">[Link Text](https://...)</code>
              </p>
              {editingQuestion?.links && editingQuestion.links.length > 0 && (
                <div className="space-y-2 mt-2">
                  {editingQuestion.links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-secondary/30 border border-border">
                      <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${link.type === 'video' ? 'bg-red-500/20 text-red-400' : link.type === 'article' ? 'bg-blue-500/20 text-blue-400' : 'bg-secondary text-muted-foreground'}`}>
                        {link.type}
                      </span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:text-primary truncate flex items-center gap-1">
                        {link.title || link.url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Forum URL Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Discourse Forum Topic (Optional)
              </Label>
              <Input
                placeholder="https://forum.openhamprep.com/t/topic-slug/123"
                value={editForumUrl || ''}
                onChange={e => setEditForumUrl(e.target.value || null)}
              />
              <p className="text-xs text-muted-foreground">
                Link to the Discourse forum topic for this question. When set, explanations will sync bidirectionally.
              </p>
              {(() => {
                const safeForumUrl = getSafeUrl(editForumUrl);
                return safeForumUrl ? (
                  <a
                    href={safeForumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Open in Forum <ExternalLink className="w-3 h-3" />
                  </a>
                ) : editForumUrl ? (
                  <p className="text-xs text-destructive">
                    Invalid URL format. Please enter a valid http:// or https:// URL.
                  </p>
                ) : null;
              })()}
            </div>

            <Separator />

            {/* Linked Topics (Read-only) */}
            {editingQuestion && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Linked Topics
                </Label>
                <p className="text-sm text-muted-foreground">
                  Topics are linked from the Topics admin section. Go to Admin &gt; Topics to manage topic-question links.
                </p>
                {(() => {
                  const linkedTopicNames = getLinkedTopicNames(editingQuestion.linked_topic_ids);
                  return linkedTopicNames.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {linkedTopicNames.map((name, index) => (
                        <Badge key={index} variant="secondary" className="bg-primary/10">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No topics linked</p>
                  );
                })()}
              </div>
            )}

            <Separator />

            <EditHistoryViewer 
              history={editingQuestion?.edit_history || []} 
              entityType="question" 
            />
            
            <div className="flex justify-between gap-2">
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Question
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Question</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete question "{editingQuestion?.display_name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => editingQuestion && deleteQuestion.mutate(editingQuestion.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateQuestion} disabled={updateQuestion.isPending}>
                  {updateQuestion.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Question */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">

              {testType.charAt(0).toUpperCase() + testType.slice(1)} Questions ({questions.length})
            </span>
            <div className="flex items-center gap-2">
              <BulkExport
                data={questions}
                filename={`${testType}_questions`}
                itemLabel="questions"
                formatCSV={(items) => {
                  const header = 'display_name,question,option_a,option_b,option_c,option_d,correct_answer,explanation';
                  const rows = items.map(q => [
                    escapeCSVField(q.display_name),
                    escapeCSVField(q.question),
                    escapeCSVField(q.options[0]),
                    escapeCSVField(q.options[1]),
                    escapeCSVField(q.options[2]),
                    escapeCSVField(q.options[3]),
                    ['A', 'B', 'C', 'D'][q.correct_answer],
                    escapeCSVField(q.explanation || ''),
                  ].join(','));
                  return [header, ...rows].join('\n');
                }}
                formatJSON={(items) => items.map(q => ({
                  id: q.id,
                  display_name: q.display_name,
                  question: q.question,
                  options: q.options,
                  correct_answer: q.correct_answer,
                  explanation: q.explanation || null,
                  links: q.links || [],
                }))}
              />
              <BulkImportQuestions testType={testType} />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Question</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Question ID (FCC assigned, e.g., T1A01)</Label>
                    <Input placeholder="e.g., T1A01" value={newId} onChange={e => setNewId(e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">
                      This is the official FCC question ID and cannot be changed after creation.
                    </p>
                  </div>

                  <div>
                    <Label>Question Text</Label>
                    <Textarea placeholder="Enter the question..." value={newQuestion} onChange={e => setNewQuestion(e.target.value)} rows={3} />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Options</Label>
                    {['A', 'B', 'C', 'D'].map((letter, index) => <div key={letter} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-mono">
                          {letter}
                        </span>
                        <Input placeholder={`Option ${letter}`} value={newOptions[index]} onChange={e => updateOption(index, e.target.value)} />
                      </div>)}
                  </div>
                  
                  <div>
                    <Label>Correct Answer</Label>
                    <Select value={newCorrectAnswer} onValueChange={setNewCorrectAnswer}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">A</SelectItem>
                        <SelectItem value="1">B</SelectItem>
                        <SelectItem value="2">C</SelectItem>
                        <SelectItem value="3">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Explanation Section */}
                  <div>
                    <Label>Explanation (shown after answering)</Label>
                    <Textarea
                      placeholder="Explain why this is the correct answer..."
                      value={newExplanation}
                      onChange={e => setNewExplanation(e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This explanation will be shown to users after they answer the question.
                    </p>
                  </div>

                  <Separator />

                  {/* Figure Section */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Question Figure (Optional)
                    </Label>
                    <FigureUpload
                      questionId={newId || 'new-question'}
                      currentFigureUrl={newFigureUrl}
                      onUpload={(url) => setNewFigureUrl(url)}
                      onRemove={() => setNewFigureUrl(null)}
                    />
                  </div>

                  <Separator />

                  {/* Learning Resources Info */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Learning Resources
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Links are automatically extracted from the explanation. Use markdown syntax: <code className="px-1 py-0.5 rounded bg-muted text-xs">[Link Text](https://...)</code>
                    </p>
                  </div>

                  <Button onClick={handleAddQuestion} disabled={addQuestion.isPending} className="w-full">
                    {addQuestion.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Question
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </CardTitle>
          <div className="flex flex-col gap-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search questions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="negative-feedback-filter"
                  checked={showNegativeFeedbackOnly}
                  onCheckedChange={(checked) => setShowNegativeFeedbackOnly(checked === true)}
                />
                <label 
                  htmlFor="negative-feedback-filter" 
                  className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
                >
                  <ThumbsDown className="w-3 h-3 text-destructive" />
                  Negative feedback
                </label>
              </div>
              {showNegativeFeedbackOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNegativeFeedbackOnly(false)}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear filter
                </Button>
              )}
              <span className="text-sm text-muted-foreground ml-auto">
                {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div> : <div className="space-y-3 h-full overflow-y-auto pb-4">
              {filteredQuestions.map(q => <div key={q.id} className={`flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors ${highlightQuestionId === q.display_name ? 'border-amber-500 bg-amber-500/5' : 'border-border'}`}>
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {q.display_name}
                      </span>
                      {q.links && q.links.length > 0 && <Badge variant="secondary" className="text-xs">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          {q.links.length}
                        </Badge>}
                      {q.linked_topic_ids && q.linked_topic_ids.length > 0 && <Badge variant="outline" className="text-xs bg-primary/5">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {q.linked_topic_ids.length} topic{q.linked_topic_ids.length !== 1 ? 's' : ''}
                        </Badge>}
                      {q.forum_url && (
                        <SyncStatusBadge
                          status={q.discourse_sync_status}
                          syncAt={q.discourse_sync_at}
                          error={q.discourse_sync_error}
                          questionId={q.display_name}
                          forumUrl={q.forum_url}
                          onRetrySync={() => handleRetrySync(q.display_name)}
                        />
                      )}
                      {feedbackStats[q.display_name] && <Badge variant="outline" className="text-xs gap-1">
                          <ThumbsUp className="w-3 h-3 text-success" />
                          <span className="text-success">{feedbackStats[q.display_name].helpful}</span>
                          <ThumbsDown className="w-3 h-3 text-destructive ml-1" />
                          <span className="text-destructive">{feedbackStats[q.display_name].notHelpful}</span>
                        </Badge>}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{q.question}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => handleEditClick(q)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>)}
              {filteredQuestions.length === 0 && <p className="text-center text-muted-foreground py-8">
                  {searchTerm ? "No matching questions found" : "No questions found"}
                </p>}
            </div>}
        </CardContent>
      </Card>
    </div>;
}