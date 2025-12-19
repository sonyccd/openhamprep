#!/usr/bin/env python3
"""
Test the discourse-webhook Supabase function locally.

Usage:
    python scripts/test-webhook.py "Your explanation text here"
    python scripts/test-webhook.py --topic 1 "New explanation for T1A01"
    python scripts/test-webhook.py --topic 2 "New explanation for T1A02"
    python scripts/test-webhook.py --test  # Run all test cases

Prerequisites:
    pip install requests
    npm run supabase:start
    npm run supabase:functions

Seeded questions with forum_url (topic_id -> question_id):
    1 -> T1A01 (Basis and Purpose)
    2 -> T1A02 (FCC Regulation)
    3 -> T1A03 (Phonetic Alphabet)
"""

import argparse
import hashlib
import hmac
import json
import sys

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    sys.exit(1)

# Static dev configuration
FUNCTION_URL = "http://localhost:54321/functions/v1/discourse-webhook"
WEBHOOK_SECRET = "test-secret-for-local-dev"  # Must match .env.local

# Seeded topic_id -> question_id mapping (from seed.sql)
SEEDED_TOPICS = {
    1: "T1A01",
    2: "T1A02",
    3: "T1A03",
}


def compute_signature(payload: str, secret: str) -> str:
    """Compute HMAC-SHA256 signature like Discourse does."""
    signature = hmac.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"


def send_webhook(
    explanation: str,
    topic_id: int = 1,
    post_number: int = 1,
    event_type: str = "post",
    event_name: str = "post_edited",
    custom_signature: str = None
) -> dict:
    """Send a webhook request to the local function."""

    # Build the post content in the expected format
    raw_content = f"""## Question
Which of the following is part of the Basis and Purpose of the Amateur Radio Service?

## Answer Options
- **A)** Option A
- **B)** Option B
- **C)** Option C
- **D)** Option D

**Correct Answer: C**

---

## Explanation
{explanation}

---
_This topic was automatically created to facilitate community discussion._"""

    payload = {
        "post": {
            "id": 100,
            "topic_id": topic_id,
            "post_number": post_number,
            "raw": raw_content,
            "cooked": "<p>HTML content</p>",
            "username": "test_user",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-02T00:00:00Z",
        }
    }

    body = json.dumps(payload)
    signature = custom_signature or compute_signature(body, WEBHOOK_SECRET)

    headers = {
        "Content-Type": "application/json",
        "X-Discourse-Event-Type": event_type,
        "X-Discourse-Event": event_name,
        "X-Discourse-Event-Signature": signature,
        "X-Discourse-Instance": "https://forum.openhamprep.com",
    }

    try:
        response = requests.post(FUNCTION_URL, headers=headers, data=body, timeout=30)
        return {
            "status": response.status_code,
            "body": response.json() if response.text else {}
        }
    except requests.exceptions.ConnectionError:
        return {"status": 0, "body": {"error": "Cannot connect. Is Supabase running? Try: npm run supabase:functions"}}
    except Exception as e:
        return {"status": 0, "body": {"error": str(e)}}


def run_tests():
    """Run all test cases."""
    print("\n=== Discourse Webhook Test Suite ===\n")
    print(f"URL: {FUNCTION_URL}")
    print(f"Secret: {WEBHOOK_SECRET[:10]}...")
    print(f"Seeded topics: {SEEDED_TOPICS}\n")

    tests = [
        # Security tests
        ("Invalid signature rejected", lambda: send_webhook("test", custom_signature="sha256=invalid"), 401, "Invalid"),

        # Event filtering tests
        ("Non-post event ignored", lambda: send_webhook("test", event_type="topic"), 200, "ignored"),
        ("post_created ignored", lambda: send_webhook("test", event_name="post_created"), 200, "ignored"),
        ("Reply post ignored", lambda: send_webhook("test", post_number=2), 200, "ignored"),

        # Full flow test (uses seeded question T1A01 with topic_id=1)
        ("Valid update to T1A01", lambda: send_webhook("UPDATED: This is a new test explanation from the webhook!", topic_id=1), 200, None),

        # Update to different question
        ("Valid update to T1A02", lambda: send_webhook("T1A02 updated explanation!", topic_id=2), 200, None),
    ]

    passed = 0
    for name, test_fn, expected_status, expected_contains in tests:
        result = test_fn()
        body_str = json.dumps(result.get("body", {}))

        status_ok = result["status"] == expected_status
        content_ok = expected_contains is None or expected_contains.lower() in body_str.lower()

        if status_ok and content_ok:
            print(f"  ✅ {name}")
            if result["body"].get("status") == "updated":
                print(f"     → Updated {result['body'].get('questionId')} ({result['body'].get('previousLength', 0)} → {result['body'].get('explanationLength', 0)} chars)")
            passed += 1
        else:
            print(f"  ❌ {name}")
            print(f"     Expected: {expected_status}" + (f" containing '{expected_contains}'" if expected_contains else ""))
            print(f"     Got: {result['status']}: {body_str[:100]}")

    print(f"\n{'='*50}")
    print(f"Results: {passed}/{len(tests)} passed\n")
    return passed == len(tests)


def main():
    parser = argparse.ArgumentParser(
        description="Test the discourse-webhook function locally",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Run automated tests
    python scripts/test-webhook.py --test

    # Update explanation for T1A01 (topic_id=1)
    python scripts/test-webhook.py "The FCC regulates amateur radio."

    # Update explanation for T1A02 (topic_id=2)
    python scripts/test-webhook.py --topic 2 "The answer is C because..."

    # Test that replies are ignored
    python scripts/test-webhook.py --reply "This should be ignored"

Seeded topic_id -> question_id:
    1 -> T1A01, 2 -> T1A02, 3 -> T1A03
        """
    )

    parser.add_argument("explanation", nargs="?", help="Explanation text to send")
    parser.add_argument("--topic", "-t", type=int, default=1, help="Topic ID (default: 1 = T1A01)")
    parser.add_argument("--reply", action="store_true", help="Send as reply (post_number=2, should be ignored)")
    parser.add_argument("--test", action="store_true", help="Run all test cases")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show full response")

    args = parser.parse_args()

    if args.test:
        success = run_tests()
        sys.exit(0 if success else 1)

    if not args.explanation:
        parser.print_help()
        sys.exit(1)

    post_number = 2 if args.reply else 1
    question_id = SEEDED_TOPICS.get(args.topic, f"topic_{args.topic}")

    print(f"\n📤 Sending webhook...")
    print(f"   Topic ID: {args.topic} ({question_id})")
    print(f"   Post #: {post_number}")
    print(f"   Explanation: {args.explanation[:50]}{'...' if len(args.explanation) > 50 else ''}")

    result = send_webhook(
        explanation=args.explanation,
        topic_id=args.topic,
        post_number=post_number
    )

    print(f"\n📥 Response (HTTP {result['status']}):")
    if args.verbose:
        print(json.dumps(result["body"], indent=2))
    else:
        body = result["body"]
        status = body.get("status", body.get("error", "unknown"))
        print(f"   Status: {status}")
        if "questionId" in body:
            print(f"   Question: {body['questionId']}")
        if "explanationLength" in body:
            print(f"   Length: {body.get('previousLength', 0)} → {body['explanationLength']} chars")
        if "reason" in body:
            print(f"   Reason: {body['reason']}")
        if "error" in body:
            print(f"   Error: {body['error']}")
    print()


if __name__ == "__main__":
    main()
