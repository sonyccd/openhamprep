import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Search, Loader2, Link as LinkIcon, ExternalLink } from "lucide-react";
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

interface LinkData {
  url: string;
  title: string;
  description: string;
  image: string;
  type: 'video' | 'article' | 'website';
  siteName: string;
  unfurledAt?: string;
}

interface QuestionWithLinks {
  id: string;
  question: string;
  links: LinkData[];
}

interface AdminLinksProps {
  testType: 'technician' | 'general' | 'extra';
}

const TEST_TYPE_PREFIXES = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

export function AdminLinks({ testType }: AdminLinksProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin-questions-with-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question, links')
        .order('id', { ascending: true });
      
      if (error) throw error;
      return data.map(q => ({
        id: q.id,
        question: q.question,
        links: (Array.isArray(q.links) ? q.links : []) as unknown as LinkData[]
      })) as QuestionWithLinks[];
    },
  });

  const addLink = async () => {
    if (!selectedQuestionId.trim() || !newUrl.trim()) {
      toast.error("Please enter both question ID and URL");
      return;
    }

    setIsAddingLink(true);
    try {
      const response = await supabase.functions.invoke('manage-question-links', {
        body: {
          action: 'add',
          questionId: selectedQuestionId.trim().toUpperCase(),
          url: newUrl.trim()
        }
      });

      if (response.error) throw response.error;

      queryClient.invalidateQueries({ queryKey: ['admin-questions-with-links'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setNewUrl("");
      toast.success("Link added successfully");
    } catch (error: any) {
      toast.error("Failed to add link: " + error.message);
    } finally {
      setIsAddingLink(false);
    }
  };

  const removeLink = useMutation({
    mutationFn: async ({ questionId, url }: { questionId: string; url: string }) => {
      const response = await supabase.functions.invoke('manage-question-links', {
        body: {
          action: 'remove',
          questionId,
          url
        }
      });

      if (response.error) throw response.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions-with-links'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success("Link removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove link: " + error.message);
    },
  });

  const prefix = TEST_TYPE_PREFIXES[testType];
  const testTypeQuestions = questions.filter(q => q.id.startsWith(prefix));
  const questionsWithLinks = testTypeQuestions.filter(q => q.links && q.links.length > 0);
  
  const filteredQuestions = questionsWithLinks.filter(q => 
    q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.links.some(l => l.url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Add Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Add Link to Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Question ID</Label>
              <Input
                placeholder="e.g., T1A01"
                value={selectedQuestionId}
                onChange={(e) => setSelectedQuestionId(e.target.value)}
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={addLink} 
            disabled={isAddingLink}
          >
            {isAddingLink ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Link
          </Button>
        </CardContent>
      </Card>

      {/* Questions with Links */}
      <Card>
        <CardHeader>
          <CardTitle>{testType.charAt(0).toUpperCase() + testType.slice(1)} Questions with Links ({questionsWithLinks.length})</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions or URLs..."
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
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {filteredQuestions.map((q) => (
                <div 
                  key={q.id} 
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {q.id}
                    </span>
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {q.question}
                    </span>
                  </div>
                  
                  <div className="space-y-2 pl-4 border-l-2 border-border">
                    {q.links.map((link, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between gap-2 p-2 rounded bg-secondary/30"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
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
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Link</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove this link from question {q.id}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => removeLink.mutate({ questionId: q.id, url: link.url })}
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
                </div>
              ))}
              {filteredQuestions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {searchTerm ? "No matching questions found" : "No questions have links yet"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
