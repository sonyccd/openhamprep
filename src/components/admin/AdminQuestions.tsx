import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Search, Loader2, Pencil, Link as LinkIcon, ExternalLink } from "lucide-react";
import { BulkImportQuestions } from "./BulkImportQuestions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  subelement: string;
  question_group: string;
  links?: LinkData[];
}

interface AdminQuestionsProps {
  testType: 'technician' | 'general' | 'extra';
  highlightQuestionId?: string;
}

const TEST_TYPE_PREFIXES = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

export function AdminQuestions({ testType, highlightQuestionId }: AdminQuestionsProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // New question form state
  const [newId, setNewId] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("0");
  const [newSubelement, setNewSubelement] = useState("");
  const [newQuestionGroup, setNewQuestionGroup] = useState("");

  // Edit state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editOptions, setEditOptions] = useState(["", "", "", ""]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState("0");
  const [editSubelement, setEditSubelement] = useState("");
  const [editQuestionGroup, setEditQuestionGroup] = useState("");
  const [editLinks, setEditLinks] = useState<LinkData[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin-questions-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question, options, correct_answer, subelement, question_group, links')
        .order('id', { ascending: true });
      
      if (error) throw error;
      return data.map(q => ({
        ...q,
        options: q.options as string[],
        links: (Array.isArray(q.links) ? q.links : []) as unknown as LinkData[]
      })) as Question[];
    },
  });

  // Auto-open edit dialog when highlightQuestionId is set
  useEffect(() => {
    if (highlightQuestionId && questions.length > 0) {
      const question = questions.find(q => q.id === highlightQuestionId);
      if (question) {
        handleEditClick(question);
      }
    }
  }, [highlightQuestionId, questions]);

  const addQuestion = useMutation({
    mutationFn: async (question: Omit<Question, 'links'>) => {
      const { error } = await supabase
        .from('questions')
        .insert({
          id: question.id.trim().toUpperCase(),
          question: question.question.trim(),
          options: question.options,
          correct_answer: question.correct_answer,
          subelement: question.subelement.trim(),
          question_group: question.question_group.trim(),
          links: []
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      resetForm();
      setIsAddDialogOpen(false);
      toast.success("Question added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add question: " + error.message);
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async (question: Question) => {
      const { error } = await supabase
        .from('questions')
        .update({
          question: question.question.trim(),
          options: question.options,
          correct_answer: question.correct_answer,
          subelement: question.subelement.trim(),
          question_group: question.question_group.trim(),
        })
        .eq('id', question.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setEditingQuestion(null);
      toast.success("Question updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update question: " + error.message);
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success("Question deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete question: " + error.message);
    },
  });

  const addLinkToQuestion = async () => {
    if (!editingQuestion || !newLinkUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsAddingLink(true);
    try {
      const response = await supabase.functions.invoke('manage-question-links', {
        body: {
          action: 'add',
          questionId: editingQuestion.id,
          url: newLinkUrl.trim()
        }
      });

      if (response.error) throw response.error;

      queryClient.invalidateQueries({ queryKey: ['admin-questions-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-questions-with-links'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      
      // Refresh the edit dialog with updated links
      const { data } = await supabase
        .from('questions')
        .select('links')
        .eq('id', editingQuestion.id)
        .single();
      
      if (data) {
        setEditLinks((Array.isArray(data.links) ? data.links : []) as unknown as LinkData[]);
      }
      
      setNewLinkUrl("");
      toast.success("Link added successfully");
    } catch (error: any) {
      toast.error("Failed to add link: " + error.message);
    } finally {
      setIsAddingLink(false);
    }
  };

  const removeLinkFromQuestion = async (url: string) => {
    if (!editingQuestion) return;

    try {
      const response = await supabase.functions.invoke('manage-question-links', {
        body: {
          action: 'remove',
          questionId: editingQuestion.id,
          url
        }
      });

      if (response.error) throw response.error;

      queryClient.invalidateQueries({ queryKey: ['admin-questions-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-questions-with-links'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      
      setEditLinks(prev => prev.filter(l => l.url !== url));
      toast.success("Link removed successfully");
    } catch (error: any) {
      toast.error("Failed to remove link: " + error.message);
    }
  };

  const resetForm = () => {
    setNewId("");
    setNewQuestion("");
    setNewOptions(["", "", "", ""]);
    setNewCorrectAnswer("0");
    setNewSubelement("");
    setNewQuestionGroup("");
  };

  const prefix = TEST_TYPE_PREFIXES[testType];
  const testTypeQuestions = questions.filter(q => q.id.startsWith(prefix));
  
  const filteredQuestions = testTypeQuestions.filter(q => 
    q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddQuestion = () => {
    if (!newId.trim() || !newQuestion.trim() || newOptions.some(o => !o.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    addQuestion.mutate({
      id: newId,
      question: newQuestion,
      options: newOptions.map(o => o.trim()),
      correct_answer: parseInt(newCorrectAnswer),
      subelement: newSubelement,
      question_group: newQuestionGroup,
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
    setEditSubelement(q.subelement);
    setEditQuestionGroup(q.question_group);
    setEditLinks(q.links || []);
    setNewLinkUrl("");
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
      id: editingQuestion.id,
      question: editQuestion,
      options: editOptions.map(o => o.trim()),
      correct_answer: parseInt(editCorrectAnswer),
      subelement: editSubelement,
      question_group: editQuestionGroup,
    });
  };

  return (
    <div className="space-y-6">
      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Question: {editingQuestion?.id}
              {highlightQuestionId === editingQuestion?.id && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
                  From Stats
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subelement</Label>
                <Input
                  placeholder="e.g., T1"
                  value={editSubelement}
                  onChange={(e) => setEditSubelement(e.target.value)}
                />
              </div>
              <div>
                <Label>Question Group</Label>
                <Input
                  placeholder="e.g., T1A"
                  value={editQuestionGroup}
                  onChange={(e) => setEditQuestionGroup(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label>Question Text</Label>
              <Textarea
                placeholder="Enter the question..."
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Options</Label>
              {['A', 'B', 'C', 'D'].map((letter, index) => (
                <div key={letter} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-mono">
                    {letter}
                  </span>
                  <Input
                    placeholder={`Option ${letter}`}
                    value={editOptions[index]}
                    onChange={(e) => updateEditOption(index, e.target.value)}
                  />
                </div>
              ))}
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

            <Separator />

            {/* Learning Resources Section */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Learning Resources ({editLinks.length})
              </Label>
              
              {/* Add new link */}
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={addLinkToQuestion} 
                  disabled={isAddingLink}
                  size="sm"
                >
                  {isAddingLink ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Existing links */}
              {editLinks.length > 0 ? (
                <div className="space-y-2">
                  {editLinks.map((link, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 rounded bg-secondary/30 border border-border"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                          link.type === 'video' ? 'bg-red-500/20 text-red-400' :
                          link.type === 'article' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {link.type}
                        </span>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-foreground hover:text-primary truncate flex items-center gap-1"
                        >
                          {link.title || link.url}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7 shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Link</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove this learning resource from the question?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => removeLinkFromQuestion(link.url)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No learning resources attached yet
                </p>
              )}
            </div>

            <Separator />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateQuestion} 
                disabled={updateQuestion.isPending}
              >
                {updateQuestion.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Question */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {testType.charAt(0).toUpperCase() + testType.slice(1)} Questions ({testTypeQuestions.length})
            </span>
            <div className="flex items-center gap-2">
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
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Question ID</Label>
                      <Input
                        placeholder="e.g., T1A01"
                        value={newId}
                        onChange={(e) => setNewId(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Subelement</Label>
                      <Input
                        placeholder="e.g., T1"
                        value={newSubelement}
                        onChange={(e) => setNewSubelement(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Question Group</Label>
                      <Input
                        placeholder="e.g., T1A"
                        value={newQuestionGroup}
                        onChange={(e) => setNewQuestionGroup(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Question Text</Label>
                    <Textarea
                      placeholder="Enter the question..."
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Options</Label>
                    {['A', 'B', 'C', 'D'].map((letter, index) => (
                      <div key={letter} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-mono">
                          {letter}
                        </span>
                        <Input
                          placeholder={`Option ${letter}`}
                          value={newOptions[index]}
                          onChange={(e) => updateOption(index, e.target.value)}
                        />
                      </div>
                    ))}
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
                  
                  <Button 
                    onClick={handleAddQuestion} 
                    disabled={addQuestion.isPending}
                    className="w-full"
                  >
                    {addQuestion.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Question
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-400px)] min-h-[200px] overflow-y-auto pb-8">
              {filteredQuestions.map((q) => (
                <div 
                  key={q.id} 
                  className={`flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors ${
                    highlightQuestionId === q.id 
                      ? 'border-amber-500 bg-amber-500/5' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {q.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {q.subelement} / {q.question_group}
                      </span>
                      {q.links && q.links.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          {q.links.length}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => handleEditClick(q)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Question</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete question "{q.id}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteQuestion.mutate(q.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {filteredQuestions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {searchTerm ? "No matching questions found" : "No questions found"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
