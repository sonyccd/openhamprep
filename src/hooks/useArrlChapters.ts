import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  ArrlChapter,
  ArrlChapterRow,
  ArrlChapterWithCount,
  LicenseType,
  CreateChapterInput,
  UpdateChapterInput,
} from "@/types/chapters";

/**
 * Transform database row to ArrlChapter interface
 */
function transformChapter(row: ArrlChapterRow): ArrlChapter {
  return {
    id: row.id,
    licenseType: row.license_type as LicenseType,
    chapterNumber: row.chapter_number,
    title: row.title,
    description: row.description,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all ARRL chapters, optionally filtered by license type
 */
export function useArrlChapters(licenseType?: LicenseType) {
  return useQuery({
    queryKey: ['arrl-chapters', licenseType],
    queryFn: async () => {
      let query = supabase
        .from('arrl_chapters')
        .select('*')
        .order('display_order', { ascending: true })
        .order('chapter_number', { ascending: true });

      if (licenseType) {
        query = query.eq('license_type', licenseType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as ArrlChapterRow[]).map(transformChapter);
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

/**
 * Fetch ARRL chapters with question counts for display.
 * Uses a server-side RPC function for efficient aggregation instead of
 * fetching all questions client-side.
 */
export function useArrlChaptersWithCounts(licenseType?: LicenseType) {
  return useQuery({
    queryKey: ['arrl-chapters-with-counts', licenseType],
    queryFn: async () => {
      // First fetch chapters
      let chapterQuery = supabase
        .from('arrl_chapters')
        .select('*')
        .order('display_order', { ascending: true })
        .order('chapter_number', { ascending: true });

      if (licenseType) {
        chapterQuery = chapterQuery.eq('license_type', licenseType);
      }

      const { data: chapters, error: chaptersError } = await chapterQuery;
      if (chaptersError) throw chaptersError;

      // Fetch question counts using efficient server-side aggregation
      const { data: counts, error: countsError } = await supabase
        .rpc('get_chapter_question_counts', {
          license_prefix: licenseType || null,
        });

      if (countsError) throw countsError;

      // Build count map from RPC results
      const countMap = new Map<string, number>();
      (counts || []).forEach((row: { chapter_id: string; question_count: number }) => {
        countMap.set(row.chapter_id, row.question_count);
      });

      // Transform and add counts
      const chaptersWithCounts: ArrlChapterWithCount[] = (chapters as ArrlChapterRow[]).map((row) => ({
        ...transformChapter(row),
        questionCount: countMap.get(row.id) || 0,
      }));

      return chaptersWithCounts;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes (admin may need fresher data)
  });
}

/**
 * Fetch a single ARRL chapter by ID
 */
export function useArrlChapter(id: string | undefined) {
  return useQuery({
    queryKey: ['arrl-chapter', id],
    queryFn: async () => {
      if (!id) throw new Error('Chapter ID is required');

      const { data, error } = await supabase
        .from('arrl_chapters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return transformChapter(data as ArrlChapterRow);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * CRUD mutations for ARRL chapters (admin only)
 */
export function useChapterMutations() {
  const queryClient = useQueryClient();

  const addChapter = useMutation({
    mutationFn: async (input: CreateChapterInput) => {
      const { data, error } = await supabase
        .from('arrl_chapters')
        .insert({
          license_type: input.licenseType,
          chapter_number: input.chapterNumber,
          title: input.title,
          description: input.description || null,
          display_order: input.displayOrder ?? input.chapterNumber,
        })
        .select()
        .single();

      if (error) throw error;
      return transformChapter(data as ArrlChapterRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arrl-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['arrl-chapters-with-counts'] });
      toast.success('Chapter added successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('A chapter with this number already exists for this license type');
      } else {
        toast.error(`Failed to add chapter: ${error.message}`);
      }
    },
  });

  const updateChapter = useMutation({
    mutationFn: async (input: UpdateChapterInput) => {
      const updates: Partial<ArrlChapterRow> = {};

      if (input.chapterNumber !== undefined) {
        updates.chapter_number = input.chapterNumber;
      }
      if (input.title !== undefined) {
        updates.title = input.title;
      }
      if (input.description !== undefined) {
        updates.description = input.description;
      }
      if (input.displayOrder !== undefined) {
        updates.display_order = input.displayOrder;
      }
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('arrl_chapters')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return transformChapter(data as ArrlChapterRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arrl-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['arrl-chapters-with-counts'] });
      queryClient.invalidateQueries({ queryKey: ['arrl-chapter'] });
      toast.success('Chapter updated successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('A chapter with this number already exists for this license type');
      } else {
        toast.error(`Failed to update chapter: ${error.message}`);
      }
    },
  });

  const deleteChapter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('arrl_chapters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arrl-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['arrl-chapters-with-counts'] });
      toast.success('Chapter deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete chapter: ${error.message}`);
    },
  });

  return {
    addChapter,
    updateChapter,
    deleteChapter,
  };
}
