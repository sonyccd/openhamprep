/**
 * Security Tests for User Deletion
 *
 * These tests verify that the delete_own_account PostgreSQL function
 * contains the required security checks. They read the migration file
 * and verify the security patterns are present.
 *
 * IMPORTANT: Do not remove or modify these tests without security review.
 * The checks ensure that:
 * 1. Only authenticated users can delete accounts
 * 2. Users can only delete their own account (via auth.uid())
 * 3. Anonymous users cannot call the function
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATION_FILE = path.join(
  __dirname,
  '../../supabase/migrations/20251211000000_add_delete_user_function.sql'
);

describe('delete_own_account Security Checks', () => {
  let migrationContent: string;

  beforeAll(() => {
    migrationContent = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  });

  describe('Authentication Requirements', () => {
    it('uses auth.uid() to identify the current user', () => {
      // The function MUST use auth.uid() to get the current user
      // This is Supabase's secure way to identify authenticated users
      expect(migrationContent).toContain('auth.uid()');
    });

    it('checks that current_user_id is not null', () => {
      // The function MUST check if the user is authenticated
      // auth.uid() returns NULL for unauthenticated requests
      expect(migrationContent).toMatch(/current_user_id\s+IS\s+NULL/i);
    });

    it('returns error when not authenticated', () => {
      // When auth.uid() is NULL, the function must return an error
      expect(migrationContent).toContain("'Not authenticated'");
    });
  });

  describe('Authorization Restrictions', () => {
    it('deletes only the current user (not arbitrary users)', () => {
      // The DELETE statement MUST only target the current user
      // It should delete WHERE id = current_user_id (from auth.uid())
      expect(migrationContent).toMatch(
        /DELETE\s+FROM\s+auth\.users\s+WHERE\s+id\s*=\s*current_user_id/i
      );
    });

    it('does not accept user_id as a parameter', () => {
      // The function should NOT accept a user_id parameter
      // This prevents users from deleting other accounts
      expect(migrationContent).not.toMatch(
        /FUNCTION\s+public\.delete_own_account\s*\(\s*user_id/i
      );
    });
  });

  describe('Permission Configuration', () => {
    it('uses SECURITY DEFINER to run with elevated privileges', () => {
      // SECURITY DEFINER is required to delete from auth.users
      expect(migrationContent).toContain('SECURITY DEFINER');
    });

    it('grants execute only to authenticated role', () => {
      // Only authenticated users should be able to call this function
      expect(migrationContent).toMatch(
        /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.delete_own_account\s*\(\s*\)\s+TO\s+authenticated/i
      );
    });

    it('revokes execute from anon role', () => {
      // Anonymous users MUST NOT be able to call this function
      expect(migrationContent).toMatch(
        /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.delete_own_account\s*\(\s*\)\s+FROM\s+anon/i
      );
    });

    it('revokes execute from public role', () => {
      // Public role MUST NOT be able to call this function
      expect(migrationContent).toMatch(
        /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.delete_own_account\s*\(\s*\)\s+FROM\s+public/i
      );
    });
  });

  describe('Security Documentation', () => {
    it('has a comment explaining the security model', () => {
      // The function should have documentation about its security
      expect(migrationContent).toContain('COMMENT ON FUNCTION');
      expect(migrationContent).toMatch(/auth\.uid\(\)/);
    });
  });
});

describe('ProfileModal Delete Account Integration', () => {
  it('uses supabase.rpc to call the secure function', async () => {
    const profileModalPath = path.join(
      __dirname,
      '../components/ProfileModal.tsx'
    );
    const profileModalContent = fs.readFileSync(profileModalPath, 'utf-8');

    // The ProfileModal MUST use supabase.rpc('delete_own_account')
    // NOT supabase.functions.invoke (Edge Function) which has different security
    expect(profileModalContent).toContain("supabase.rpc('delete_own_account')");
    expect(profileModalContent).not.toContain("supabase.functions.invoke('delete-user')");
  });
});
