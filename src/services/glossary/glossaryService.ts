import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult } from '../types';

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

class GlossaryService extends ServiceBase {
  async getAll(): Promise<ServiceResult<GlossaryTerm[]>> {
    return this.handleQueryAllowEmpty(
      () =>
        supabase
          .from('glossary_terms')
          .select('id, term, definition')
          .order('term', { ascending: true }),
      [],
      'Failed to fetch glossary terms'
    );
  }
}

export const glossaryService = new GlossaryService();
