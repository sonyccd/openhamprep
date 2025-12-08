import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

export function AdminGlossary() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  
  // Edit state
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editDefinition, setEditDefinition] = useState("");

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ['admin-glossary-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('id, term, definition')
        .order('term', { ascending: true });
      
      if (error) throw error;
      return data as GlossaryTerm[];
    },
  });

  const addTerm = useMutation({
    mutationFn: async ({ term, definition }: { term: string; definition: string }) => {
      const { error } = await supabase
        .from('glossary_terms')
        .insert({ term: term.trim(), definition: definition.trim() });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
      queryClient.invalidateQueries({ queryKey: ['glossary-terms'] });
      setNewTerm("");
      setNewDefinition("");
      toast.success("Term added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add term: " + error.message);
    },
  });

  const updateTerm = useMutation({
    mutationFn: async ({ id, term, definition }: { id: string; term: string; definition: string }) => {
      const { error } = await supabase
        .from('glossary_terms')
        .update({ term: term.trim(), definition: definition.trim() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
      queryClient.invalidateQueries({ queryKey: ['glossary-terms'] });
      setEditingTerm(null);
      toast.success("Term updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update term: " + error.message);
    },
  });

  const deleteTerm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('glossary_terms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
      queryClient.invalidateQueries({ queryKey: ['glossary-terms'] });
      toast.success("Term deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete term: " + error.message);
    },
  });

  const filteredTerms = terms.filter(t => 
    t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTerm = () => {
    if (!newTerm.trim() || !newDefinition.trim()) {
      toast.error("Please fill in both term and definition");
      return;
    }
    addTerm.mutate({ term: newTerm, definition: newDefinition });
  };

  const handleEditClick = (term: GlossaryTerm) => {
    setEditingTerm(term);
    setEditTerm(term.term);
    setEditDefinition(term.definition);
  };

  const handleUpdateTerm = () => {
    if (!editingTerm || !editTerm.trim() || !editDefinition.trim()) {
      toast.error("Please fill in both term and definition");
      return;
    }
    updateTerm.mutate({ id: editingTerm.id, term: editTerm, definition: editDefinition });
  };

  return (
    <div className="space-y-6">
      {/* Edit Dialog */}
      <Dialog open={!!editingTerm} onOpenChange={(open) => !open && setEditingTerm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Term</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Term</Label>
              <Input
                value={editTerm}
                onChange={(e) => setEditTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Definition</Label>
              <Textarea
                value={editDefinition}
                onChange={(e) => setEditDefinition(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTerm(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTerm} disabled={updateTerm.isPending}>
                {updateTerm.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Term */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Term
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Term"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
          />
          <Textarea
            placeholder="Definition"
            value={newDefinition}
            onChange={(e) => setNewDefinition(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={handleAddTerm} 
            disabled={addTerm.isPending}
          >
            {addTerm.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Term
          </Button>
        </CardContent>
      </Card>

      {/* Search and List */}
      <Card>
        <CardHeader>
          <CardTitle>Glossary Terms ({terms.length})</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
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
              {filteredTerms.map((term) => (
                <div 
                  key={term.id} 
                  className="flex items-start justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h4 className="font-semibold text-foreground">{term.term}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{term.definition}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => handleEditClick(term)}
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
                          <AlertDialogTitle>Delete Term</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{term.term}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteTerm.mutate(term.id)}
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
              {filteredTerms.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No terms found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
