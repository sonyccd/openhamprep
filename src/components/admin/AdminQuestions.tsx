import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Search, Loader2, Pencil } from "lucide-react";
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

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  subelement: string;
  question_group: string;
}

interface AdminQuestionsProps {
  testType: 'technician' | 'general' | 'extra';
}

const TEST_TYPE_PREFIXES = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

export function AdminQuestions({ testType }: AdminQuestionsProps) {
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

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question, options, correct_answer, subelement, question_group')
        .order('id', { ascending: true });
      
      if (error) throw error;
      return data.map(q => ({
        ...q,
        options: q.options as string[]
      })) as Question[];
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success("Question deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete question: " + error.message);
    },
  });

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
            <DialogTitle>Edit Question: {editingQuestion?.id}</DialogTitle>
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
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredQuestions.map((q) => (
                <div 
                  key={q.id} 
                  className="flex items-start justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {q.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {q.subelement} / {q.question_group}
                      </span>
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
                <p className="text-center text-muted-foreground py-8">No questions found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
