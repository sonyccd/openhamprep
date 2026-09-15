import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { queryKeys } from "@/services/queryKeys";
import type { EditHistoryEntry } from "../EditHistoryViewer";
import type { GlossaryTerm } from "./termDraft";

interface UseGlossaryAdminOptions {
  /** Called after a create or update lands, so the caller can close its dialog. */
  onAdded: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

/**
 * The glossary term query and its three mutations.
 *
 * Lifted out of AdminGlossary because CLAUDE.md asks for mutations to live in
 * hooks rather than inline in components, and because the component was over
 * the line budget with them in place. The dialog-closing side effects stay with
 * the caller — the hook should not know what a dialog is.
 */
export function useGlossaryAdmin({ onAdded, onUpdated, onDeleted }: UseGlossaryAdminOptions) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: terms = [], isLoading } = useQuery({
    queryKey: queryKeys.glossary.adminTerms(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('id, term, definition, edit_history')
        .order('term', { ascending: true });
      
      if (error) throw error;
      return data.map(t => ({
        ...t,
        edit_history: (Array.isArray(t.edit_history) ? t.edit_history : []) as unknown as EditHistoryEntry[]
      })) as GlossaryTerm[];
    },
  });

  const addTerm = useMutation({
    mutationFn: async ({ term, definition }: { term: string; definition: string }) => {
      if (!user) throw new Error('Not authenticated');
      const historyEntry: EditHistoryEntry = {
        user_id: user.id,
        user_email: user.email || 'Unknown',
        action: 'created',
        changes: {},
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('glossary_terms')
        .insert({ 
          term: term.trim(), 
          definition: definition.trim(),
          edit_history: JSON.parse(JSON.stringify([historyEntry]))
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.glossary.adminTerms() });
      queryClient.invalidateQueries({ queryKey: queryKeys.glossary.terms() });
      onAdded();
      toast.success("Term added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add term: " + error.message);
    },
  });

  const updateTerm = useMutation({
    mutationFn: async ({ id, term, definition, originalTerm }: { id: string; term: string; definition: string; originalTerm: GlossaryTerm }) => {
      if (!user) throw new Error('Not authenticated');
      // Build changes object
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (originalTerm.term !== term.trim()) {
        changes.term = { from: originalTerm.term, to: term.trim() };
      }
      if (originalTerm.definition !== definition.trim()) {
        changes.definition = { from: originalTerm.definition, to: definition.trim() };
      }

      const historyEntry: EditHistoryEntry = {
        user_id: user.id,
        user_email: user.email || 'Unknown',
        action: 'updated',
        changes,
        timestamp: new Date().toISOString(),
      };

      const existingHistory = originalTerm.edit_history || [];

      const { error } = await supabase
        .from('glossary_terms')
        .update({ 
          term: term.trim(), 
          definition: definition.trim(),
          edit_history: JSON.parse(JSON.stringify([...existingHistory, historyEntry]))
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.glossary.adminTerms() });
      queryClient.invalidateQueries({ queryKey: queryKeys.glossary.terms() });
      onUpdated();
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
      queryClient.invalidateQueries({ queryKey: queryKeys.glossary.adminTerms() });
      queryClient.invalidateQueries({ queryKey: queryKeys.glossary.terms() });
      onDeleted();
      toast.success("Term deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete term: " + error.message);
    },
  });

  return { terms, isLoading, addTerm, updateTerm, deleteTerm };
}
