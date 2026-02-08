import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult, success, failure } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ExamSession {
  id: string;
  title: string | null;
  exam_date: string;
  sponsor: string | null;
  exam_time: string | null;
  walk_ins_allowed: boolean;
  public_contact: string | null;
  phone: string | null;
  email: string | null;
  vec: string | null;
  location_name: string | null;
  address: string | null;
  address_2: string | null;
  address_3: string | null;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export type LicenseType = 'technician' | 'general' | 'extra';
export type ExamOutcome = 'passed' | 'failed' | 'skipped';

export interface UserTargetExam {
  id: string;
  user_id: string;
  exam_session_id: string | null;
  custom_exam_date: string | null;
  study_intensity: 'light' | 'moderate' | 'intensive';
  target_license: LicenseType | null;
  created_at: string;
  updated_at: string;
  exam_session?: ExamSession | null;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_date: string;
  target_license: LicenseType;
  outcome: ExamOutcome | null;
  exam_session_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exam_session?: ExamSession | null;
}

export interface PaginatedSessions {
  sessions: ExamSession[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BulkImportResult {
  count: number;
  convertedTargets: number;
  deletedSessions: number;
}

export interface SaveTargetParams {
  userId: string;
  examSessionId?: string;
  customExamDate?: string;
  studyIntensity: 'light' | 'moderate' | 'intensive';
  targetLicense?: LicenseType;
}

export interface RecordAttemptParams {
  userId: string;
  examDate: string;
  targetLicense: LicenseType;
  outcome?: ExamOutcome;
  examSessionId?: string;
  notes?: string;
}

export interface UpdateOutcomeParams {
  attemptId: string;
  outcome: ExamOutcome;
  notes?: string;
}

export interface GeocodeSessions {
  sessions: ExamSession[];
  totalCount: number;
  limitReached: boolean;
}

interface SessionFilters {
  zip?: string;
  startDate?: string;
  endDate?: string;
  state?: string;
  walkInsOnly?: boolean;
}

/** PostgREST's maximum rows per request */
const POSTGREST_PAGE_SIZE = 1000;

/** Safety limit to prevent memory issues with very large datasets */
const MAX_GEOCODE_SESSIONS = 10000;

// ============================================================================
// Service
// ============================================================================

class ExamSessionService extends ServiceBase {
  async getSessions(
    filters?: SessionFilters,
    page = 1,
    pageSize = 50
  ): Promise<ServiceResult<PaginatedSessions>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('exam_sessions')
        .select('*', { count: 'exact' })
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .order('exam_date', { ascending: true });

      if (filters?.startDate) {
        query = query.gte('exam_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('exam_date', filters.endDate);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }
      if (filters?.zip && filters.zip.length >= 3) {
        const zipPrefix = filters.zip.substring(0, 3);
        query = query.ilike('zip', `${zipPrefix}*`);
      }
      if (filters?.walkInsOnly) {
        query = query.eq('walk_ins_allowed', true);
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) {
        return {
          success: false,
          error: this.normalizePostgrestError(error, 'Failed to fetch exam sessions'),
        };
      }

      return success({
        sessions: (data as ExamSession[]) ?? [],
        totalCount: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      });
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, 'Failed to fetch exam sessions'),
      };
    }
  }

  async getCount(): Promise<ServiceResult<number>> {
    try {
      const { count, error } = await supabase
        .from('exam_sessions')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return {
          success: false,
          error: this.normalizePostgrestError(error, 'Failed to get session count'),
        };
      }

      return success(count ?? 0);
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, 'Failed to get session count'),
      };
    }
  }

  async getLastUpdated(): Promise<ServiceResult<string | null>> {
    return this.handleQueryAllowEmpty(
      async () => {
        const { data, error } = await supabase
          .from('exam_sessions')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return { data: data?.updated_at ?? null, error };
      },
      null,
      'Failed to get last updated timestamp'
    );
  }

  async getUserTarget(
    userId: string
  ): Promise<ServiceResult<(UserTargetExam & { exam_session: ExamSession | null }) | null>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQueryAllowEmpty(
      () =>
        supabase
          .from('user_target_exam')
          .select(`
            *,
            exam_session:exam_sessions(*)
          `)
          .eq('user_id', userId)
          .maybeSingle(),
      null,
      'Failed to fetch user target exam'
    );
  }

  async saveTarget(params: SaveTargetParams): Promise<ServiceResult<unknown>> {
    if ((!params.examSessionId && !params.customExamDate) ||
        (params.examSessionId && params.customExamDate)) {
      return failure(
        'VALIDATION_ERROR',
        'Must provide either examSessionId or customExamDate, not both'
      );
    }

    return this.handleMutation(
      () =>
        supabase
          .from('user_target_exam')
          .upsert(
            {
              user_id: params.userId,
              exam_session_id: params.examSessionId || null,
              custom_exam_date: params.customExamDate || null,
              study_intensity: params.studyIntensity,
              target_license: params.targetLicense || null,
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single(),
      'Failed to save target exam'
    );
  }

  async removeTarget(userId: string): Promise<ServiceResult<void>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleVoidMutation(
      () =>
        supabase
          .from('user_target_exam')
          .delete()
          .eq('user_id', userId),
      'Failed to remove target exam'
    );
  }

  async bulkImport(
    sessions: Omit<ExamSession, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<ServiceResult<BulkImportResult>> {
    try {
      const { data, error } = await supabase.rpc('bulk_import_exam_sessions_safe', {
        sessions_data: sessions,
      });

      if (error) {
        return failure('DATABASE_ERROR', `Bulk import failed: ${error.message}`, error);
      }

      if (!data || data.length === 0) {
        return failure(
          'DATABASE_ERROR',
          'Bulk import returned no result - transaction may have failed'
        );
      }

      const result = data[0];
      return success({
        count: result.inserted_sessions_count,
        convertedTargets: result.converted_targets_count,
        deletedSessions: result.deleted_sessions_count,
      });
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, 'Bulk import failed'),
      };
    }
  }

  async getAttempts(
    userId: string
  ): Promise<ServiceResult<(ExamAttempt & { exam_session: ExamSession | null })[]>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQueryAllowEmpty(
      () =>
        supabase
          .from('exam_attempts')
          .select(`
            *,
            exam_session:exam_sessions(*)
          `)
          .eq('user_id', userId)
          .order('exam_date', { ascending: false }),
      [],
      'Failed to fetch exam attempts'
    );
  }

  async recordAttempt(params: RecordAttemptParams): Promise<ServiceResult<unknown>> {
    return this.handleMutation(
      () =>
        supabase
          .from('exam_attempts')
          .insert({
            user_id: params.userId,
            exam_date: params.examDate,
            target_license: params.targetLicense,
            outcome: params.outcome || null,
            exam_session_id: params.examSessionId || null,
            notes: params.notes || null,
          })
          .select()
          .single(),
      'Failed to record exam attempt'
    );
  }

  async updateOutcome(params: UpdateOutcomeParams): Promise<ServiceResult<unknown>> {
    return this.handleMutation(
      () =>
        supabase
          .from('exam_attempts')
          .update({
            outcome: params.outcome,
            ...(params.notes !== undefined && { notes: params.notes }),
          })
          .eq('id', params.attemptId)
          .select()
          .single(),
      'Failed to update exam outcome'
    );
  }

  async getNeedingGeocodeCount(): Promise<ServiceResult<number>> {
    try {
      const { count, error } = await supabase
        .from('exam_sessions')
        .select('*', { count: 'exact', head: true })
        .not('address', 'is', null)
        .not('city', 'is', null)
        .not('state', 'is', null)
        .or('latitude.is.null,longitude.is.null');

      if (error) {
        return {
          success: false,
          error: this.normalizePostgrestError(error, 'Failed to get geocode count'),
        };
      }

      return success(count ?? 0);
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, 'Failed to get geocode count'),
      };
    }
  }

  async getSessionsNeedingGeocode(
    includeAll = false
  ): Promise<ServiceResult<GeocodeSessions>> {
    try {
      const allSessions: ExamSession[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('exam_sessions')
          .select('*')
          .not('address', 'is', null)
          .not('city', 'is', null)
          .not('state', 'is', null)
          .order('exam_date', { ascending: true })
          .range(page * POSTGREST_PAGE_SIZE, (page + 1) * POSTGREST_PAGE_SIZE - 1);

        if (!includeAll) {
          query = query.or('latitude.is.null,longitude.is.null');
        }

        const { data, error } = await query;
        if (error) {
          return {
            success: false,
            error: this.normalizePostgrestError(error, 'Failed to fetch sessions needing geocode'),
          };
        }

        if (data && data.length > 0) {
          allSessions.push(...(data as ExamSession[]));
          hasMore = data.length === POSTGREST_PAGE_SIZE;
          page++;

          if (allSessions.length >= MAX_GEOCODE_SESSIONS) {
            console.warn(
              `Geocode query reached ${MAX_GEOCODE_SESSIONS} session limit. ` +
              `Some sessions may not be included.`
            );
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      return success({
        sessions: allSessions,
        totalCount: allSessions.length,
        limitReached: allSessions.length >= MAX_GEOCODE_SESSIONS,
      });
    } catch (error) {
      return {
        success: false,
        error: this.normalizeError(error, 'Failed to fetch sessions needing geocode'),
      };
    }
  }
}

export const examSessionService = new ExamSessionService();
