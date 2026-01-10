import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EditHistoryEntry } from "@/components/admin/EditHistoryViewer";

export interface HamRadioToolCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  icon_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface HamRadioTool {
  id: string;
  category_id: string | null;
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  storage_path: string | null;
  is_published: boolean;
  display_order: number;
  edit_history: EditHistoryEntry[];
  created_at: string;
  updated_at: string;
  category?: HamRadioToolCategory;
}

/**
 * Get the image URL for a tool, preferring storage_path over image_url.
 * Falls back to image_url if storage URL is unavailable.
 */
export function getToolImageUrl(tool: HamRadioTool): string | null {
  if (tool.storage_path) {
    const { data } = supabase.storage
      .from('ham-radio-tools')
      .getPublicUrl(tool.storage_path);
    return data.publicUrl || tool.image_url;
  }
  return tool.image_url;
}

/**
 * Fetch all categories
 */
export function useHamRadioToolCategories() {
  return useQuery({
    queryKey: ['ham-radio-tool-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ham_radio_tool_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as HamRadioToolCategory[];
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

/**
 * Fetch all published tools with category information
 */
export function useHamRadioTools(categorySlug?: string) {
  return useQuery({
    queryKey: ['ham-radio-tools', categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ham_radio_tools')
        .select(`
          *,
          category:ham_radio_tool_categories(*)
        `)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      let tools = data as HamRadioTool[];

      // Filter by category slug if provided
      if (categorySlug) {
        tools = tools.filter(t => t.category?.slug === categorySlug);
      }

      return tools;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Fetch all tools for admin (including unpublished)
 */
export function useAdminHamRadioTools() {
  return useQuery({
    queryKey: ['admin-ham-radio-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ham_radio_tools')
        .select(`
          *,
          category:ham_radio_tool_categories(*)
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as HamRadioTool[];
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes (admin needs fresher data)
  });
}

/**
 * Create a new tool
 */
export function useCreateHamRadioTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tool: Omit<HamRadioTool, 'id' | 'created_at' | 'updated_at' | 'category'>) => {
      const { data, error } = await supabase
        .from('ham_radio_tools')
        .insert(tool)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ham-radio-tools'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ham-radio-tools'] });
    },
  });
}

/**
 * Update a tool
 */
export function useUpdateHamRadioTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HamRadioTool> & { id: string }) => {
      const { data, error } = await supabase
        .from('ham_radio_tools')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ham-radio-tools'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ham-radio-tools'] });
    },
  });
}

/**
 * Delete a tool
 */
export function useDeleteHamRadioTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, get the tool to check if it has a storage_path
      const { data: tool, error: fetchError } = await supabase
        .from('ham_radio_tools')
        .select('storage_path')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete the image from storage if it exists
      // Log errors but don't fail - we still want to delete the DB record
      if (tool?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('ham-radio-tools')
          .remove([tool.storage_path]);
        if (storageError) {
          console.error('Failed to delete tool image:', storageError);
        }
      }

      // Delete the tool from the database
      const { error } = await supabase
        .from('ham_radio_tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ham-radio-tools'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ham-radio-tools'] });
    },
  });
}

/**
 * Create a new category
 */
export function useCreateHamRadioToolCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<HamRadioToolCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ham_radio_tool_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ham-radio-tool-categories'] });
    },
  });
}

/**
 * Update a category
 */
export function useUpdateHamRadioToolCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HamRadioToolCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('ham_radio_tool_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ham-radio-tool-categories'] });
    },
  });
}

/**
 * Delete a category
 */
export function useDeleteHamRadioToolCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ham_radio_tool_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ham-radio-tool-categories'] });
      queryClient.invalidateQueries({ queryKey: ['ham-radio-tools'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ham-radio-tools'] });
    },
  });
}
