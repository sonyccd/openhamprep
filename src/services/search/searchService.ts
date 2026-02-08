import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult, success, failure } from '../types';

/**
 * Raw response shape from the search_content RPC function.
 */
export interface SearchContentResponse {
  questions: Array<{
    id: string;
    display_name: string;
    question: string;
    explanation: string;
    rank: number;
  }>;
  glossary: Array<{
    id: string;
    term: string;
    definition: string;
    rank: number;
  }>;
  topics: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    rank: number;
  }>;
  tools: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    rank: number;
  }>;
}

export interface SearchContentParams {
  searchQuery: string;
  licensePrefix: string;
  questionsLimit?: number;
  glossaryLimit?: number;
  topicsLimit?: number;
  toolsLimit?: number;
}

class SearchService extends ServiceBase {
  async searchContent(
    params: SearchContentParams
  ): Promise<ServiceResult<SearchContentResponse>> {
    try {
      const { data, error } = await supabase.rpc('search_content', {
        search_query: params.searchQuery,
        license_prefix: params.licensePrefix,
        questions_limit: params.questionsLimit ?? 5,
        glossary_limit: params.glossaryLimit ?? 5,
        topics_limit: params.topicsLimit ?? 3,
        tools_limit: params.toolsLimit ?? 3,
      });

      if (error) {
        return failure('DATABASE_ERROR', `Search failed: ${error.message}`, error);
      }

      return success(data as SearchContentResponse);
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, 'Search failed'),
      };
    }
  }
}

export const searchService = new SearchService();
