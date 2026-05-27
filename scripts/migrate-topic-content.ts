/**
 * Migration script to move topic content from Supabase Storage to the database.
 *
 * This script:
 * 1. Fetches all topics that have a content_path set
 * 2. Downloads the markdown content from storage
 * 3. Saves the content to the new `content` column in the topics table
 *
 * Usage:
 *   npx tsx scripts/migrate-topic-content.ts
 *
 * Prerequisites:
 * - Ensure the migration 20260107192011_add_content_to_topics.sql has been applied
 * - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *   (or use local Supabase with the default anon key for development)
 */

import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";

// Require env vars — no key fallback so a misconfigured SUPABASE_URL=<prod> never
// silently falls through to the well-known local demo key.
const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) as string;
if (!supabaseKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set.");
  process.exit(1);
}

// Check if running against production by parsing the URL properly
function isProductionUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Local development hosts
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return false;
    }

    // Supabase production domains - check exact match or subdomain
    if (
      hostname === "supabase.co" ||
      hostname === "supabase.com" ||
      hostname.endsWith(".supabase.co") ||
      hostname.endsWith(".supabase.com")
    ) {
      return true;
    }

    // Any other non-local URL is treated as production for safety
    return true;
  } catch {
    // If URL parsing fails, assume it could be production for safety
    return true;
  }
}

const isProduction = isProductionUrl(supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function confirmProduction(): Promise<boolean> {
  if (!isProduction) return true;

  console.log("\n⚠️  WARNING: You are about to run this migration against PRODUCTION!");
  console.log(`   URL: ${supabaseUrl}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Type 'yes' to continue or any other key to abort: ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
}

interface TopicWithContentPath {
  id: string;
  slug: string;
  content_path: string;
  content: string | null;
}

async function migrateTopicContent() {
  console.log("🚀 Starting topic content migration...\n");
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Environment: ${isProduction ? "PRODUCTION" : "Local/Development"}\n`);

  // Require confirmation for production
  const confirmed = await confirmProduction();
  if (!confirmed) {
    console.log("\n❌ Migration aborted by user.");
    process.exit(0);
  }

  // Fetch all topics with content_path set (and content not already migrated)
  const { data: topics, error: fetchError } = await supabase
    .from("topics")
    .select("id, slug, content_path, content")
    .not("content_path", "is", null);

  if (fetchError) {
    console.error("❌ Failed to fetch topics:", fetchError.message);
    process.exit(1);
  }

  if (!topics || topics.length === 0) {
    console.log("ℹ️  No topics with content_path found. Nothing to migrate.");
    return;
  }

  console.log(`📋 Found ${topics.length} topic(s) with content_path\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const topic of topics as TopicWithContentPath[]) {
    process.stdout.write(`   Processing "${topic.slug}"... `);

    // Skip if content already exists
    if (topic.content && topic.content.trim().length > 0) {
      console.log("⏭️  Skipped (content already exists)");
      skipCount++;
      continue;
    }

    try {
      // Download content from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("topic-content")
        .download(topic.content_path);

      if (downloadError) {
        if (
          downloadError.message.includes("not found") ||
          downloadError.message.includes("Object not found")
        ) {
          console.log("⏭️  Skipped (file not found in storage)");
          skipCount++;
          continue;
        }
        throw downloadError;
      }

      // Read the content as text
      const content = await fileData.text();

      if (!content || content.trim().length === 0) {
        console.log("⏭️  Skipped (empty file)");
        skipCount++;
        continue;
      }

      // Save to database
      const { error: updateError } = await supabase
        .from("topics")
        .update({
          content: content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topic.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Migrated (${content.length} chars)`);
      successCount++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.log(`❌ Error: ${errorMessage}`);
      errorCount++;
    }
  }

  console.log("\n📊 Migration Summary:");
  console.log(`   ✅ Migrated: ${successCount}`);
  console.log(`   ⏭️  Skipped:  ${skipCount}`);
  console.log(`   ❌ Errors:   ${errorCount}`);
  console.log("\n✨ Migration complete!");
}

// Run the migration
migrateTopicContent().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
