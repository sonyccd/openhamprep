# Email Templates for Open Ham Prep

Custom email templates for Supabase Auth that match the Open Ham Prep design system.

## Available Templates

| Template | File | Supabase Setting |
|----------|------|------------------|
| Confirm Signup | `confirm-signup.html` | Authentication > Email Templates > Confirm signup |

## How to Use in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Email Templates**
3. Select the template type (e.g., "Confirm signup")
4. Copy the contents of the corresponding `.html` file
5. Paste into the **Body** field (switch to "Source" mode first)
6. Update the **Subject** field as needed
7. Click **Save changes**

## Available Template Variables

These variables are provided by Supabase and can be used in templates:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | The full confirmation URL for the user to click |
| `{{ .Token }}` | The raw confirmation token |
| `{{ .TokenHash }}` | Hashed version of the token |
| `{{ .SiteURL }}` | Your site URL (configured in Supabase) |
| `{{ .Email }}` | The user's email address |
| `{{ .Data }}` | Custom metadata passed during signup |
| `{{ .RedirectTo }}` | Redirect URL after confirmation |

## Design System

The templates use colors and styling that match the Open Ham Prep app:

### Colors (Dark Theme)
- **Background**: `#0f172a` (slate-950)
- **Card Background**: `#1e293b` (slate-800)
- **Border**: `#334155` (slate-700)
- **Primary (Amber)**: `#eab308`
- **Primary Dark**: `#ca8a04`
- **Text Primary**: `#f1f5f9` (slate-100)
- **Text Secondary**: `#94a3b8` (slate-400)
- **Text Muted**: `#64748b` (slate-500)

### Typography
- **Headings**: JetBrains Mono (monospace)
- **Body**: System fonts (Apple, BlinkMac, Segoe UI, Roboto)

## Testing

To test your email templates:

1. Use a tool like [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/)
2. Or simply sign up for a new account in your dev/staging environment
3. Check how the email renders in various email clients

## Email Client Compatibility

These templates are designed to work with:
- Gmail (Web, iOS, Android)
- Apple Mail
- Outlook (Web, Desktop, Mobile)
- Yahoo Mail
- Most modern email clients

The templates use table-based layouts and inline styles for maximum compatibility.
