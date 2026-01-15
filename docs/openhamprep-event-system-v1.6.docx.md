  
**OpenHamPrep**

Event System Architecture

*Data Capture & Storage Infrastructure*

Version 1.6 | January 2026

*Open Source Documentation*

# **Contents**

1\. Overview

2\. Design Rationale

3\. Resource Calculations

4\. Question Identity & Pool Versioning

5\. Database Schema

6\. Event Types

7\. Client Integration

8\. Data Lifecycle (Hot & Cold Storage)

9\. Querying Events

10\. Migration Plan

11\. Pool Transitions

12\. Monitoring

Appendix A: Complete Schema SQL

Appendix B: Existing Tables Reference

Appendix C: Event Type Quick Reference

# **1\. Overview**

## **1.1 Purpose**

This document defines the event-sourcing infrastructure for capturing user learning interactions in OpenHamPrep. The system collects granular event data that powers analytics, readiness scoring, and model calibration.

OpenHamPrep is an open-source amateur radio exam preparation platform. This architecture is designed to be adaptable for other countries' licensing exams that follow a similar multiple-choice format. While examples use US exam terminology, the system makes no hard assumptions about regulatory bodies or exam structures.

## **1.2 Design Principles**

* Append-Only: Events are immutable once written; never modified during normal operation

* Never Delete: Events move from hot storage (database) to cold storage (archive); nothing is ever deleted

* Capture Everything: Record all context that might be useful later, even if not immediately needed

* Pool-Aware: Every question event tracks both location (question code) and identity (content hash)

* Internationally Adaptable: No hard-coded assumptions about regulatory bodies or exam structures

* Compute Separately: This system captures and stores; all analysis happens in separate systems

* Cost-Conscious: Designed to run within Supabase Pro plan limits (\~$25/month)

## **1.3 Event Types Overview**

The system captures three event types:

| Event Type | Frequency | Purpose |
| :---- | :---- | :---- |
| question\_attempt | Very High | Every question answered; core learning data |
| practice\_test\_completed | Medium | Full practice exam completions with breakdown |
| exam\_outcome | Low | Real exam results for model calibration |

Note: Session tracking (start/end times, duration) is reconstructed from question\_attempt timestamps during analytics rather than captured as separate events. This approach is more robust to definition changes and reduces event volume.

## **1.4 Relationship to Existing Schema**

The event system integrates with the existing OpenHamPrep database:

| Existing Table | Event System Relationship |
| :---- | :---- |
| questions | Events store question\_id (UUID) as foreign key |
| profiles | Events store user\_id (UUID) referencing auth.users |
| question\_attempts | Events capture similar data with richer context |
| question\_mastery | Downstream; computed from events, cached |
| practice\_test\_results | Events capture with full breakdown |
| user\_readiness\_cache | Downstream; computed from events, includes subelement metrics |

# **2\. Design Rationale**

This section explains the key architectural decisions. Understanding these helps contributors make informed changes and helps other projects learn from our approach.

## **2.1 Why Event Sourcing?**

We chose an append-only event log over direct table updates because:

### **Direct Updates (Previous Approach)**

When a user answers a question, the old system would:

1. Insert a row into question\_attempts

2. Update counters in question\_mastery

3. Update cached metrics in user\_readiness\_cache

Limitations:

* Lost context: Only stored that an attempt happened, not timing, mode, or session context

* Rigid schema: Adding new metrics required migrations and backfilling

* Coupled computation: Application must update all downstream tables

* Hard to evolve: Changing formulas means updating code AND migrating data

### **Event Sourcing (This Design)**

With event sourcing:

4. Insert an immutable event with full context

5. Downstream systems compute from events as needed

6. New fields can be added without breaking existing consumers

Benefits:

* Complete history with full context preserved forever

* New metrics can be computed from historical events

* Readiness model can evolve; just reprocess the same events differently

* Can trace exactly how any user reached their current state

## **2.2 Why Direct PostgREST (Not Edge Functions)?**

Question attempts insert directly via PostgREST rather than edge functions:

| Approach | Latency | Cost at 10k MAU | Complexity |
| :---- | :---- | :---- | :---- |
| Edge Function | 100-200ms | $10-15/month | Higher |
| Direct PostgREST | 30-50ms | $0 (included) | Lower |

At 10,000 MAU with 500 questions/user/month \= 5M requests. Edge functions would add $10-15/month (40-60% of the Pro plan cost) while being 3-5x slower. Direct inserts are free, fast, and simple.

Edge functions are reserved for operations requiring server-side logic: readiness computation, outcome reporting with state snapshots, and archive jobs.

## **2.3 Why 500 Events in Hot Storage?**

Each user's most recent 500 events stay in the database; older events are archived to cold storage. Here's why 500:

### **What Analytics Actually Need**

| Metric | Data Required | Events Needed |
| :---- | :---- | :---- |
| Recent accuracy | Last 50 attempts | 50 |
| Overall accuracy | Last 200-300 attempts | 200-300 |
| Subelement accuracy | Last 50-100 per subelement | \~400-500 total |
| Coverage | Unique questions seen | 0 (cached incrementally) |
| Mastery | Questions correct 2+ times | 0 (cached incrementally) |
| Practice test pass rate | Last 10-20 tests | 10-20 test events |

Subelement-level analytics drive the 500 number. With \~10 subelements and needing 50+ attempts each for statistical significance, 500 events ensures adequate data for per-subelement analysis.

### **Subelement Metrics Are Cached**

Coverage and mastery (including per-subelement breakdowns) are computed incrementally and cached in user\_readiness\_cache. This means:

* Old events can be archived without losing cumulative metrics

* Real-time queries don't need to scan all 500 events

* If we need to recompute from scratch, we can rehydrate from archives

## **2.4 Why Archive Instead of Delete?**

Events are never deleted—they're archived to Supabase Storage:

| Storage Type | Cost/GB/Month | Use Case |
| :---- | :---- | :---- |
| Database | $0.125 | Fast queries, recent data |
| Object Storage | $0.021 | Cheap archival, rare access |

For \~$1-2/month extra, we keep complete history forever. This enables:

* ML model training on long-term patterns

* Research into learning curves and forgetting

* Debugging issues spanning months

* User data export requests

* Future features we haven't imagined

## **2.5 Why On-Demand Rehydration?**

When analytics need more events than are in hot storage, the system rehydrates from archives on-demand:

7. Calculation requests events for user X

8. System checks: "Do I have enough events in the database?"

9. If yes → proceed with calculation

10. If no → fetch relevant archives → load needed events → calculate

Benefits:

* Inactive users never trigger compute or rehydration

* No batch jobs needed when retention config changes

* Cost is paid only when value is delivered

* Scales naturally with actual usage patterns

## **2.6 Why Reconstruct Sessions from Questions?**

Rather than explicit session\_start/session\_end events, we reconstruct sessions from question\_attempt timestamps:

\-- Reconstruct sessions: gap \> 30 minutes \= new session  
WITH attempt\_gaps AS (  
  SELECT   
    \*,  
    timestamp \- LAG(timestamp) OVER (  
      PARTITION BY user\_id ORDER BY timestamp  
    ) AS gap\_from\_previous  
  FROM events  
  WHERE event\_type \= 'question\_attempt'  
),  
session\_boundaries AS (  
  SELECT   
    \*,  
    CASE WHEN gap\_from\_previous \> INTERVAL '30 minutes'   
         OR gap\_from\_previous IS NULL   
         THEN 1 ELSE 0 END AS is\_session\_start  
  FROM attempt\_gaps  
)  
SELECT   
  user\_id,  
  SUM(is\_session\_start) OVER (ORDER BY timestamp) AS session\_number,  
  timestamp,  
  ...  
FROM session\_boundaries;

Benefits:

* Definition changes (e.g., 30 min → 15 min gap) don't invalidate historical data

* No reliance on client correctly firing start/end events

* Fewer event types to maintain

* Session duration derived from actual activity, not browser state

## **2.7 Why Content Hashing for Pool Transitions?**

Question pools update every \~4 years. When they do:

* Question IDs may be reused for different content

* Questions may move between subelements (T5A03 → T6B07)

* Questions may be slightly edited

Content hashing solves this by fingerprinting question content:

* Same content \= same hash, regardless of ID or location

* No manual mapping tables to maintain

* Automatically detects when IDs are reused for new questions

## **2.8 International Adaptability**

While built for US amateur radio exams, the architecture avoids hard-coded assumptions:

* question\_code instead of ncvec\_id — works for any exam authority

* topic\_code instead of subelement/group — adaptable naming

* Exam types and passing thresholds are configuration, not code

* Pool versioning works for any periodic question updates

Teams adapting this for other countries would configure their exam structure, not modify core event logic.

# **3\. Resource Calculations**

This section shows the math proving the architecture fits within Supabase Pro plan limits.

## **3.1 Supabase Pro Plan Limits**

| Resource | Included | Overage Cost |
| :---- | :---- | :---- |
| Database Storage | 8 GB | $0.125/GB/month |
| Object Storage | 100 GB | $0.021/GB/month |
| Edge Function Invocations | 2M/month | $2/million |
| Bandwidth | 250 GB/month | $0.09/GB |
| Monthly Base | $25 | — |

## **3.2 Event Size Analysis**

A typical question\_attempt event:

Payload (\~250 bytes):  
{  
  "session\_id": "uuid",           // 36 bytes  
  "question\_id": "uuid",          // 36 bytes    
  "question\_code": "T5A03",       // 5 bytes  
  "content\_hash": "sha256...",    // 64 bytes  
  "pool\_version": "2022-2026",    // 9 bytes  
  "topic\_code": "T5A",            // 3 bytes  
  "answer\_selected": 2,           // 1 byte  
  "correct\_answer": 1,            // 1 byte  
  "is\_correct": false,            // 5 bytes  
  "time\_spent\_ms": 45000,         // 5 bytes  
  "time\_raw\_ms": 48000,           // 5 bytes  
  "mode": "drill"                 // 5 bytes  
}  
   
Row overhead: \~100 bytes (id, timestamp, user\_id, created\_at)  
JSONB overhead: \~50 bytes  
Index overhead: \~200 bytes  
\---------------------------------  
Total: \~600 bytes per event

## 

## **3.3 Database Storage (Hot Tier)**

At 500 events per user:

| Users | Max Events | Calculation | DB Size | % of 8GB |
| :---- | :---- | :---- | :---- | :---- |
| 5,000 | 2.5M | 2.5M × 600B | 1.5 GB | 19% |
| 10,000 | 5M | 5M × 600B | 3.0 GB | 37% |
| 20,000 | 10M | 10M × 600B | 6.0 GB | 75% |
| 25,000 | 12.5M | 12.5M × 600B | 7.5 GB | 94% |
| 30,000 | 15M | 15M × 600B | 9.0 GB | 112% ⚠️ |

The architecture supports \~25,000 users at 500 events/user before hitting storage limits. Beyond that, reduce hot retention to 400 events/user or upgrade plan.

## **3.4 Archive Storage (Cold Tier)**

Archived events compress \~10:1 with gzip:

| Timeframe | Events Archived | Raw Size | Compressed | Monthly Cost |
| :---- | :---- | :---- | :---- | :---- |
| 1 month (10k MAU) | \~500k | 300 MB | \~30 MB | $0.001 |
| 1 year (10k MAU) | \~6M | 3.6 GB | \~360 MB | $0.008 |
| 5 years (10k MAU) | \~30M | 18 GB | \~1.8 GB | $0.04 |

Complete history for 10 years costs less than $1/month in archive storage.

## **3.5 Cost Summary**

| Scale | DB Storage | Archive (Year 1\) | Total Monthly |
| :---- | :---- | :---- | :---- |
| 5,000 users | 1.5 GB | \~180 MB | $25 |
| 10,000 users | 3.0 GB | \~360 MB | $25 |
| 20,000 users | 6.0 GB | \~720 MB | $25 |
| 25,000 users | 7.5 GB | \~900 MB | $25 |

The $25/month Pro plan comfortably supports 20,000+ users with complete history preserved forever.

# **4\. Question Identity & Pool Versioning**

## **4.1 The Problem**

Exam question pools update periodically (every \~4 years for US amateur radio). When pools change:

* New questions appear with new IDs

* Old questions may be removed

* Questions may move between topic areas

* Question codes may be reused for completely different content

## **4.2 Three Identifiers**

Each question has three identifiers:

| Identifier | Source | Column | Purpose |
| :---- | :---- | :---- | :---- |
| UUID | OpenHamPrep | questions.id | Internal primary key, stable for this record |
| Question Code | Exam Authority | questions.display\_name | Official ID (e.g., T5A03), may be reused |
| Content Hash | Computed | questions.content\_hash | SHA-256 of question content |

## **4.3 How They Work Together**

| Scenario | UUID | Question Code | Content Hash |
| :---- | :---- | :---- | :---- |
| New question | New | T5A15 (new) | xyz789 (new) |
| Unchanged question | New | T5A03 (same) | abc123 (same) |
| Question moved | New | T6B07 (different) | abc123 (same) |
| Code reused | New | T5A03 (same) | def456 (different) |

Content hash enables tracking the 'same' question across pools regardless of code reassignments.

## 

## **4.4 Content Hash Generation**

function generateContentHash(question) {  
  const normalized \= \[  
    normalize(question.question),  
    normalize(question.options\[0\]),  
    normalize(question.options\[1\]),  
    normalize(question.options\[2\]),  
    normalize(question.options\[3\]),  
    question.correct\_answer.toString()  
  \].join('|');  
    
  return sha256(normalized);  
}  
   
function normalize(text) {  
  return text  
    .toLowerCase()  
    .trim()  
    .replace(/\\s+/g, ' ')  
    .replace(/\[''\]/g, "'")  
    .replace(/\[""\]/g, '"');  
}

# **5\. Database Schema**

## **5.1 Questions Table Modifications**

Add pool versioning and content hash to existing questions table:

ALTER TABLE questions   
ADD COLUMN IF NOT EXISTS content\_hash TEXT,  
ADD COLUMN IF NOT EXISTS pool\_version TEXT DEFAULT '2022-2026';  
   
CREATE INDEX idx\_questions\_content\_hash ON questions (content\_hash);  
CREATE INDEX idx\_questions\_pool\_version ON questions (pool\_version);

## **5.2 Question Pools Table**

CREATE TABLE question\_pools (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  pool\_version TEXT NOT NULL,  
  exam\_type TEXT NOT NULL,  
  effective\_date DATE NOT NULL,  
  expiration\_date DATE,  
  question\_count INT NOT NULL,  
  passing\_threshold NUMERIC NOT NULL DEFAULT 0.74,  
  is\_current BOOLEAN DEFAULT false,  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
    
  UNIQUE (pool\_version, exam\_type)  
);

## **5.3 Events Table**

CREATE TABLE events (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  event\_type TEXT NOT NULL,  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
  user\_id UUID NOT NULL REFERENCES auth.users(id),  
  payload JSONB NOT NULL,  
  created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  
);  
   
\-- Primary access patterns  
CREATE INDEX idx\_events\_user\_time ON events (user\_id, timestamp DESC);  
CREATE INDEX idx\_events\_type\_time ON events (event\_type, timestamp DESC);  
   
\-- Question-specific lookups  
CREATE INDEX idx\_events\_question\_id   
  ON events ((payload-\>\>'question\_id'))  
  WHERE event\_type \= 'question\_attempt';  
   
CREATE INDEX idx\_events\_content\_hash   
  ON events ((payload-\>\>'content\_hash'))  
  WHERE event\_type \= 'question\_attempt';  
   
CREATE INDEX idx\_events\_is\_correct  
  ON events ((payload-\>\>'is\_correct'))  
  WHERE event\_type \= 'question\_attempt';

## **5.4 Row-Level Security**

ALTER TABLE events ENABLE ROW LEVEL SECURITY;  
   
CREATE POLICY "Users insert own events" ON events  
  FOR INSERT WITH CHECK (auth.uid() \= user\_id);  
   
CREATE POLICY "Users read own events" ON events  
  FOR SELECT USING (auth.uid() \= user\_id);

# **6\. Event Types**

The system captures three event types. Session information is reconstructed from question timestamps rather than captured as separate events.

## **6.1 question\_attempt**

Captured every time a user answers a question. This is the most frequent and most important event.

| Field | Type | Description |
| :---- | :---- | :---- |
| question\_id | UUID | Foreign key to questions.id |
| question\_code | String | Official identifier (e.g., 'T5A03') |
| content\_hash | String | SHA-256 of question content |
| pool\_version | String | Question pool version (e.g., '2022-2026') |
| topic\_code | String | Topic/group code (e.g., 'T5A') |
| answer\_selected | Integer | User's answer (0, 1, 2, or 3\) |
| correct\_answer | Integer | Correct answer (0, 1, 2, or 3\) |
| is\_correct | Boolean | Whether answer was correct (denormalized for indexing) |
| time\_spent\_ms | Integer | Time on question, capped at 180000 (3 min) |
| time\_raw\_ms | Integer | Actual elapsed time (for outlier analysis) |
| mode | String | 'drill', 'practice\_test', or 'review' |
| practice\_test\_id | UUID|null | If part of a practice test |

// Example payload  
{  
  "question\_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",  
  "question\_code": "T5A03",  
  "content\_hash": "e3b0c44298fc1c149afbf4c8996fb924...",  
  "pool\_version": "2022-2026",  
  "topic\_code": "T5A",  
  "answer\_selected": 2,  
  "correct\_answer": 1,  
  "is\_correct": false,  
  "time\_spent\_ms": 45000,  
  "time\_raw\_ms": 48000,  
  "mode": "drill",  
  "practice\_test\_id": null  
}

### **Time Tracking**

Two time fields handle the background-tab problem:

* time\_spent\_ms: Capped at 180 seconds (3 minutes). Used for most analytics.

* time\_raw\_ms: Actual elapsed time. Used to identify distracted attempts (raw \>\> spent means user wasn't focused).

Client-side capping prevents meaningless outliers from a user leaving a question open while doing something else.

## **6.2 practice\_test\_completed**

Captured when a user finishes a full practice exam.

| Field | Type | Description |
| :---- | :---- | :---- |
| practice\_test\_id | UUID | Unique identifier for this test |
| test\_result\_id | UUID|null | FK to practice\_test\_results if exists |
| exam\_type | String | Exam type (e.g., 'technician') |
| pool\_version | String | Which question pool was used |
| score | Integer | Number answered correctly |
| total\_questions | Integer | Total questions (e.g., 35\) |
| passing\_threshold | Number | Required to pass (e.g., 0.74) |
| percentage | Number | Score as percentage |
| duration\_seconds | Integer | Time to complete |
| subelement\_breakdown | Object | Results by subelement |

// Example payload  
{  
  "practice\_test\_id": "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0",  
  "test\_result\_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  
  "exam\_type": "technician",  
  "pool\_version": "2022-2026",  
  "score": 28,  
  "total\_questions": 35,  
  "passing\_threshold": 0.74,  
  "percentage": 80.0,  
  "duration\_seconds": 1847,  
  "subelement\_breakdown": {  
    "T1": { "correct": 5, "total": 6 },  
    "T2": { "correct": 3, "total": 3 },  
    "T5": { "correct": 2, "total": 4 }  
  }  
}

Note: No 'passed' boolean — derive it as (score / total\_questions \>= passing\_threshold). Storing the threshold enables 'passed by how much' analysis and handles threshold changes over time.

## **6.3 exam\_outcome**

Captured when a real exam result is recorded. Most valuable for model calibration.

| Field | Type | Description |
| :---- | :---- | :---- |
| source | String | 'user\_reported', 'system\_calculated', or 'imported' |
| exam\_type | String | Which exam was taken |
| pool\_version | String | Which pool the exam used |
| score | Integer|null | Their score if known |
| total\_questions | Integer | Questions on the exam |
| passing\_threshold | Number | Required to pass |
| attempt\_number | Integer | Which attempt (1st, 2nd, etc.) |
| exam\_date | Date | When they took the exam |
| confidence\_level | String|null | How confident they felt |
| state\_snapshot | Object | User's readiness state at exam time |

// Example payload  
{  
  "source": "user\_reported",  
  "exam\_type": "technician",  
  "pool\_version": "2022-2026",  
  "score": 32,  
  "total\_questions": 35,  
  "passing\_threshold": 0.74,  
  "attempt\_number": 1,  
  "exam\_date": "2026-01-15",  
  "confidence\_level": "confident",  
  "state\_snapshot": {  
    "readiness\_score": 0.82,  
    "pass\_probability": 0.89,  
    "coverage": 0.95,  
    "recent\_accuracy": 0.78,  
    "practice\_tests\_passed": 8,  
    "practice\_tests\_taken": 10  
  }  
}

The state\_snapshot captures everything known about the user's preparation at exam time. This enables correlation analysis: 'Users with readiness \> 0.8 passed 94% of the time.'

# **7\. Client Integration**

## **7.1 Configuration**

// lib/config.ts  
export const POOL\_CONFIG \= {  
  technician: {  
    currentVersion: '2022-2026',  
    passingThreshold: 0.74,  
  },  
  general: {  
    currentVersion: '2023-2027',   
    passingThreshold: 0.74,  
  },  
  extra: {  
    currentVersion: '2024-2028',  
    passingThreshold: 0.74,  
  }  
} as const;

## **7.2 Core Event Recording**

// lib/events.ts  
export async function recordEvent({ eventType, payload }) {  
  const { data: { user } } \= await supabase.auth.getUser();  
    
  if (\!user) {  
    console.warn('Cannot record event: not authenticated');  
    return { error: 'Not authenticated' };  
  }  
   
  const { error } \= await supabase  
    .from('events')  
    .insert({  
      event\_type: eventType,  
      user\_id: user.id,  
      payload  
    });  
   
  if (error) {  
    console.error('Failed to record event:', error);  
    return { error: error.message };  
  }  
   
  return { success: true };  
}

## **7.3 Question Attempt Helper**

// lib/events.ts  
const TIME\_CAP\_MS \= 180000; // 3 minutes  
   
export async function recordQuestionAttempt({  
  question,  
  answerSelected,  
  timeElapsedMs,  
  mode,  
  practiceTestId  
}) {  
  const isCorrect \= answerSelected \=== question.correct\_answer;  
    
  return recordEvent({  
    eventType: 'question\_attempt',  
    payload: {  
      question\_id: question.id,  
      question\_code: question.display\_name,  
      content\_hash: question.content\_hash,  
      pool\_version: question.pool\_version,  
      topic\_code: question.question\_group,  
      answer\_selected: answerSelected,  
      correct\_answer: question.correct\_answer,  
      is\_correct: isCorrect,  
      time\_spent\_ms: Math.min(timeElapsedMs, TIME\_CAP\_MS),  
      time\_raw\_ms: timeElapsedMs,  
      mode,  
      practice\_test\_id: practiceTestId || null  
    }  
  });  
}

## **7.4 Practice Test Helper**

// lib/events.ts  
export async function recordPracticeTestCompleted({  
  practiceTestId,  
  testResultId,  
  examType,  
  poolVersion,  
  score,  
  totalQuestions,  
  passingThreshold,  
  durationSeconds,  
  subelementBreakdown  
}) {  
  const percentage \= (score / totalQuestions) \* 100;  
    
  return recordEvent({  
    eventType: 'practice\_test\_completed',  
    payload: {  
      practice\_test\_id: practiceTestId,  
      test\_result\_id: testResultId || null,  
      exam\_type: examType,  
      pool\_version: poolVersion,  
      score,  
      total\_questions: totalQuestions,  
      passing\_threshold: passingThreshold,  
      percentage,  
      duration\_seconds: durationSeconds,  
      subelement\_breakdown: subelementBreakdown  
    }  
  });  
}

## **7.5 Usage Example**

// components/QuestionCard.tsx  
export function QuestionCard({ question, onNext }) {  
  const \[startTime\] \= useState(Date.now());  
  const \[selectedAnswer, setSelectedAnswer\] \= useState(null);  
   
  const handleSubmit \= async () \=\> {  
    if (selectedAnswer \=== null) return;  
      
    const timeElapsedMs \= Date.now() \- startTime;  
      
    // Fire and forget \- don't block UI  
    recordQuestionAttempt({  
      question,  
      answerSelected: selectedAnswer,  
      timeElapsedMs,  
      mode: 'drill'  
    });  
   
    const isCorrect \= selectedAnswer \=== question.correct\_answer;  
    onNext(isCorrect);  
  };  
   
  return (/\* render question UI \*/);  
}

# **8\. Data Lifecycle (Hot & Cold Storage)**

Events are never deleted. They flow through two tiers:

* Hot tier (database): 500 most recent events per user — fast queries

* Cold tier (storage): All older events archived forever — cheap storage

## **8.1 Archive Architecture**

### **Storage Structure**

event-archive/  
├── 2026/  
│   ├── 01/  
│   │   ├── 2026-01-05-events.ndjson.gz  
│   │   ├── 2026-01-12-events.ndjson.gz  
│   │   └── 2026-01-19-events.ndjson.gz  
│   └── 02/  
│       └── ...  
└── manifests/  
    └── archive-manifest.json

Archives are date-based (one file per week). This is simpler than user-based organization and sufficient since rehydration is rare.

### **Archive Job (Weekly)**

// supabase/functions/archive-events/index.ts  
Deno.serve(async (req) \=\> {  
  // 1\. Find events to archive (beyond 500 per user, older than 7 days)  
  const { data: eventsToArchive } \= await supabase.rpc(  
    'get\_events\_to\_archive',  
    { keep\_count: 500, min\_age\_days: 7 }  
  );  
   
  if (\!eventsToArchive?.length) {  
    return Response.json({ archived: 0 });  
  }  
   
  // 2\. Convert to NDJSON and compress  
  const ndjson \= eventsToArchive  
    .map(e \=\> JSON.stringify(e))  
    .join('\\n');  
  const compressed \= gzip(ndjson);  
   
  // 3\. Upload to storage  
  const filename \= \`${year}/${month}/${date}-events.ndjson.gz\`;  
  await supabase.storage  
    .from('event-archive')  
    .upload(filename, compressed);  
   
  // 4\. Delete from database  
  await supabase  
    .from('events')  
    .delete()  
    .in('id', eventsToArchive.map(e \=\> e.id));  
   
  return Response.json({ archived: eventsToArchive.length });  
});

## **8.2 On-Demand Rehydration**

When a calculation needs more events than are in the database:

// lib/rehydration.ts  
export async function ensureEventsAvailable(userId, minCount) {  
  // Check current event count  
  const { count } \= await supabase  
    .from('events')  
    .select('\*', { count: 'exact', head: true })  
    .eq('user\_id', userId);  
   
  if (count \>= minCount) {  
    return { rehydrated: false, count };  
  }  
   
  // Need more events \- fetch from archives  
  const needed \= minCount \- count;  
  const archived \= await fetchArchivedEvents(userId, needed);  
   
  if (archived.length \> 0\) {  
    // Reload into database  
    await supabase.from('events').insert(archived);  
  }  
   
  return { rehydrated: true, count: count \+ archived.length };  
}  
   
async function fetchArchivedEvents(userId, limit) {  
  // List archive files (most recent first)  
  const { data: files } \= await supabase.storage  
    .from('event-archive')  
    .list('', { sortBy: { column: 'name', order: 'desc' } });  
   
  const events \= \[\];  
    
  for (const file of files) {  
    if (events.length \>= limit) break;  
      
    // Download and decompress  
    const { data } \= await supabase.storage  
      .from('event-archive')  
      .download(file.name);  
      
    const ndjson \= gunzip(await data.arrayBuffer());  
    const fileEvents \= ndjson  
      .split('\\n')  
      .filter(Boolean)  
      .map(JSON.parse)  
      .filter(e \=\> e.user\_id \=== userId);  
      
    events.push(...fileEvents);  
  }  
   
  return events.slice(0, limit);  
}

## **8.3 Database Function**

CREATE OR REPLACE FUNCTION get\_events\_to\_archive(  
  keep\_count INTEGER DEFAULT 500,  
  min\_age\_days INTEGER DEFAULT 7  
)  
RETURNS SETOF events AS $$  
BEGIN  
  RETURN QUERY  
  WITH ranked AS (  
    SELECT   
      e.\*,  
      ROW\_NUMBER() OVER (  
        PARTITION BY e.user\_id   
        ORDER BY e.timestamp DESC  
      ) as rn  
    FROM events e  
  )  
  SELECT id, event\_type, timestamp, user\_id, payload, created\_at  
  FROM ranked  
  WHERE rn \> keep\_count  
    AND timestamp \< NOW() \- (min\_age\_days || ' days')::INTERVAL  
  ORDER BY timestamp ASC  
  LIMIT 50000;  
END;  
$$ LANGUAGE plpgsql SECURITY DEFINER;

## **8.4 Scheduling**

\-- Weekly archive job (Sunday 4 AM UTC)  
SELECT cron.schedule(  
  'archive-old-events',  
  '0 4 \* \* 0',  
  $$  
  SELECT net.http\_post(  
    url := 'https://your-project.supabase.co/functions/v1/archive-events',  
    headers := '{"Authorization": "Bearer SERVICE\_ROLE\_KEY"}'::jsonb  
  );  
  $$  
);

# **9\. Querying Events**

## **9.1 Common Access Patterns**

| Pattern | Use Case | Index Used |
| :---- | :---- | :---- |
| User's recent events | Readiness calculation | idx\_events\_user\_time |
| Events by question | Per-question analytics | idx\_events\_question\_id |
| Events by content hash | Cross-pool tracking | idx\_events\_content\_hash |
| Correct/incorrect filter | Accuracy calculations | idx\_events\_is\_correct |

## **9.2 Example Queries**

### **User's Overall Accuracy**

SELECT   
  COUNT(\*) as attempts,  
  SUM(CASE WHEN (payload-\>\>'is\_correct')::boolean THEN 1 ELSE 0 END) as correct,  
  AVG(CASE WHEN (payload-\>\>'is\_correct')::boolean THEN 1.0 ELSE 0.0 END) as accuracy  
FROM events  
WHERE user\_id \= $1  
  AND event\_type \= 'question\_attempt';

### **Accuracy by Subelement**

SELECT   
  LEFT(payload-\>\>'topic\_code', 2\) as subelement,  
  COUNT(\*) as attempts,  
  AVG(CASE WHEN (payload-\>\>'is\_correct')::boolean THEN 1.0 ELSE 0.0 END) as accuracy  
FROM events  
WHERE user\_id \= $1  
  AND event\_type \= 'question\_attempt'  
GROUP BY LEFT(payload-\>\>'topic\_code', 2\)  
ORDER BY subelement;

### **Reconstruct Sessions**

WITH gaps AS (  
  SELECT   
    \*,  
    timestamp \- LAG(timestamp) OVER (  
      PARTITION BY user\_id ORDER BY timestamp  
    ) AS gap  
  FROM events  
  WHERE user\_id \= $1 AND event\_type \= 'question\_attempt'  
)  
SELECT   
  SUM(CASE WHEN gap \> INTERVAL '30 min' OR gap IS NULL THEN 1 ELSE 0 END)   
    OVER (ORDER BY timestamp) as session\_num,  
  \*  
FROM gaps;

### **Practice Test Pass Rate**

SELECT   
  COUNT(\*) as tests\_taken,  
  SUM(CASE   
    WHEN (payload-\>\>'score')::int::float /   
         (payload-\>\>'total\_questions')::int \>=   
         (payload-\>\>'passing\_threshold')::float   
    THEN 1 ELSE 0   
  END) as tests\_passed  
FROM events  
WHERE user\_id \= $1  
  AND event\_type \= 'practice\_test\_completed';

# **10\. Migration Plan**

## **10.1 Phases**

| Phase | Duration | Description |
| :---- | :---- | :---- |
| 1\. Schema | 1 day | Add columns to questions, create events \+ pools tables |
| 2\. Backfill Hashes | 1 day | Compute content\_hash for existing questions |
| 3\. Dual Write | 2 weeks | Capture events alongside existing tables |
| 4\. Backfill Events | 1 week | Migrate recent question\_attempts to events |
| 5\. Validate | 1 week | Verify data integrity |
| 6\. Archive Setup | 1 day | Deploy archive job and storage bucket |

## **10.2 Backfill Script**

\-- Migrate recent question\_attempts to events  
INSERT INTO events (event\_type, timestamp, user\_id, payload)  
SELECT   
  'question\_attempt',  
  qa.attempted\_at,  
  qa.user\_id,  
  jsonb\_build\_object(  
    'question\_id', qa.question\_id,  
    'question\_code', q.display\_name,  
    'content\_hash', q.content\_hash,  
    'pool\_version', q.pool\_version,  
    'topic\_code', q.question\_group,  
    'answer\_selected', qa.selected\_answer,  
    'correct\_answer', q.correct\_answer,  
    'is\_correct', qa.is\_correct,  
    'time\_spent\_ms', null,  
    'time\_raw\_ms', null,  
    'mode', 'backfill',  
    'practice\_test\_id', qa.test\_result\_id  
  )  
FROM question\_attempts qa  
JOIN questions q ON q.id \= qa.question\_id  
WHERE qa.attempted\_at \> NOW() \- INTERVAL '60 days';

# **11\. Pool Transitions**

## **11.1 When a New Pool is Released**

11. Download new pool from exam authority

12. Run import script — creates new question records with new UUIDs

13. Content hashes computed automatically during import

14. Add pool metadata to question\_pools table

15. Update POOL\_CONFIG in client

16. Deploy

## **11.2 Key Points**

* New pool \= new question records with new UUIDs

* Old questions remain (historical references stay valid)

* content\_hash links same questions across pools

* Events from multiple pools coexist; filter by pool\_version

## **11.3 Finding Moved Questions**

SELECT   
  q1.display\_name as old\_code,  
  q1.question\_group as old\_topic,  
  q2.display\_name as new\_code,  
  q2.question\_group as new\_topic  
FROM questions q1  
JOIN questions q2 ON q1.content\_hash \= q2.content\_hash  
WHERE q1.pool\_version \= '2022-2026'  
  AND q2.pool\_version \= '2026-2030'  
  AND q1.display\_name \!= q2.display\_name;

# **12\. Monitoring**

## **12.1 Health Check**

SELECT   
  (SELECT COUNT(\*) FROM events) as total\_events,  
  (SELECT COUNT(\*) FROM events   
   WHERE timestamp \> NOW() \- INTERVAL '24 hours') as events\_24h,  
  (SELECT COUNT(DISTINCT user\_id) FROM events  
   WHERE timestamp \> NOW() \- INTERVAL '7 days') as active\_users\_7d,  
  (SELECT pg\_size\_pretty(pg\_total\_relation\_size('events'))) as events\_size,  
  (SELECT COUNT(\*) FROM questions   
   WHERE content\_hash IS NULL) as questions\_missing\_hash;

## **12.2 Alerts**

| Condition | Threshold | Action |
| :---- | :---- | :---- |
| Events table size | \> 7 GB | Check archive job; reduce retention |
| Missing content\_hash | Any | Run backfill script |
| Event volume drop | \< 50% daily avg | Check client integration |
| Archive job failure | Any | Check edge function logs |

# **Appendix A: Complete Schema SQL**

\-- \=============================================  
\-- OpenHamPrep Event System Schema v1.6  
\-- \=============================================  
   
\-- 1\. QUESTIONS TABLE UPDATES  
ALTER TABLE questions   
ADD COLUMN IF NOT EXISTS content\_hash TEXT,  
ADD COLUMN IF NOT EXISTS pool\_version TEXT DEFAULT '2022-2026';  
   
CREATE INDEX IF NOT EXISTS idx\_questions\_content\_hash   
  ON questions (content\_hash);  
CREATE INDEX IF NOT EXISTS idx\_questions\_pool\_version   
  ON questions (pool\_version);  
   
\-- 2\. QUESTION POOLS TABLE  
CREATE TABLE IF NOT EXISTS question\_pools (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  pool\_version TEXT NOT NULL,  
  exam\_type TEXT NOT NULL,  
  effective\_date DATE NOT NULL,  
  expiration\_date DATE,  
  question\_count INT NOT NULL,  
  passing\_threshold NUMERIC NOT NULL DEFAULT 0.74,  
  is\_current BOOLEAN DEFAULT false,  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  UNIQUE (pool\_version, exam\_type)  
);  
   
\-- 3\. EVENTS TABLE  
CREATE TABLE IF NOT EXISTS events (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  event\_type TEXT NOT NULL,  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
  user\_id UUID NOT NULL REFERENCES auth.users(id),  
  payload JSONB NOT NULL,  
  created\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  
);  
   
CREATE INDEX idx\_events\_user\_time   
  ON events (user\_id, timestamp DESC);  
CREATE INDEX idx\_events\_type\_time   
  ON events (event\_type, timestamp DESC);  
CREATE INDEX idx\_events\_question\_id   
  ON events ((payload-\>\>'question\_id'))  
  WHERE event\_type \= 'question\_attempt';  
CREATE INDEX idx\_events\_content\_hash   
  ON events ((payload-\>\>'content\_hash'))  
  WHERE event\_type \= 'question\_attempt';  
CREATE INDEX idx\_events\_is\_correct  
  ON events ((payload-\>\>'is\_correct'))  
  WHERE event\_type \= 'question\_attempt';  
   
\-- 4\. ROW LEVEL SECURITY  
ALTER TABLE events ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "Users insert own events" ON events  
  FOR INSERT WITH CHECK (auth.uid() \= user\_id);  
CREATE POLICY "Users read own events" ON events  
  FOR SELECT USING (auth.uid() \= user\_id);  
   
ALTER TABLE question\_pools ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "Authenticated read pools" ON question\_pools  
  FOR SELECT USING (auth.role() \= 'authenticated');  
   
\-- 5\. ARCHIVE SUPPORT  
CREATE OR REPLACE FUNCTION get\_events\_to\_archive(  
  keep\_count INTEGER DEFAULT 500,  
  min\_age\_days INTEGER DEFAULT 7  
)  
RETURNS SETOF events AS $$  
BEGIN  
  RETURN QUERY  
  WITH ranked AS (  
    SELECT e.\*, ROW\_NUMBER() OVER (  
      PARTITION BY e.user\_id ORDER BY e.timestamp DESC  
    ) as rn  
    FROM events e  
  )  
  SELECT id, event\_type, timestamp, user\_id, payload, created\_at  
  FROM ranked  
  WHERE rn \> keep\_count  
    AND timestamp \< NOW() \- (min\_age\_days || ' days')::INTERVAL  
  ORDER BY timestamp ASC  
  LIMIT 50000;  
END;  
$$ LANGUAGE plpgsql SECURITY DEFINER;  
   
\-- 6\. INITIAL DATA  
INSERT INTO question\_pools (pool\_version, exam\_type, effective\_date,   
                           question\_count, passing\_threshold, is\_current)  
VALUES   
  ('2022-2026', 'technician', '2022-07-01', 412, 0.74, true),  
  ('2023-2027', 'general', '2023-07-01', 454, 0.74, true),  
  ('2024-2028', 'extra', '2024-07-01', 693, 0.74, true)  
ON CONFLICT (pool\_version, exam\_type) DO NOTHING;

# **Appendix B: Existing Tables Reference**

| Table | Key Column | Event System Relationship |
| :---- | :---- | :---- |
| questions | id (UUID) | Events store question\_id in payload |
| profiles | id (UUID) | Events store user\_id |
| question\_attempts | id (UUID) | Events capture richer version |
| question\_mastery | id (UUID) | Computed from events, cached |
| practice\_test\_results | id (UUID) | Events link via test\_result\_id |
| user\_readiness\_cache | id (UUID) | Computed from events, cached |

# **Appendix C: Event Type Quick Reference**

| Event Type | Frequency | Key Fields |
| :---- | :---- | :---- |
| question\_attempt | Very High | question\_id, question\_code, topic\_code, is\_correct, time\_spent\_ms |
| practice\_test\_completed | Medium | score, total\_questions, passing\_threshold, subelement\_breakdown |
| exam\_outcome | Low | source, score, passing\_threshold, state\_snapshot |

## **Derived Metrics (Not Stored)**

| Metric | Derivation |
| :---- | :---- |
| passed (test) | score / total\_questions \>= passing\_threshold |
| passed (exam) | score / total\_questions \>= passing\_threshold |
| session boundaries | Gap \> 30 min between question\_attempts |
| session duration | Last attempt timestamp \- first attempt timestamp |
| subelement | LEFT(topic\_code, 2\) |

