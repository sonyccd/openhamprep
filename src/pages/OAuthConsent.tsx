import { useState } from 'react';
import { useOAuthConsent } from '@/hooks/useOAuthConsent';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OAuthConsent() {
  const {
    isLoading,
    error,
    authorizationDetails,
    forumUsername,
    isProcessing,
    isAutoApproving,
    handleApprove,
    handleDeny,
  } = useOAuthConsent();

  const [newForumUsername, setNewForumUsername] = useState('');
  const [rememberDecision, setRememberDecision] = useState(true);

  // Use existing forum username if available
  const effectiveForumUsername = newForumUsername || forumUsername || '';

  if (isLoading || isAutoApproving) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {isAutoApproving
              ? "You've already authorized this app. Redirecting..."
              : 'Loading authorization request...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Authorization Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!authorizationDetails) {
    return null;
  }

  const scopeDescriptions: Record<string, string> = {
    openid: 'Verify your identity',
    email: 'View your email address',
    profile: 'View your profile information',
    phone: 'View your phone number',
  };

  const needsForumUsername = !forumUsername;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Authorize {authorizationDetails.client_name}</CardTitle>
          <CardDescription>
            This application is requesting access to your Open Ham Prep account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Requested Permissions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">This will allow the application to:</Label>
            <ul className="space-y-2">
              {authorizationDetails.scopes.map((scope) => (
                <li key={scope} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{scopeDescriptions[scope] || scope}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Forum Username Input */}
          <div className="space-y-3">
            <Label htmlFor="forum-username" className="text-sm font-medium">
              Forum Username {needsForumUsername && <span className="text-destructive">*</span>}
            </Label>
            {forumUsername ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your forum username: <span className="font-medium text-foreground">{forumUsername}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  You can change this in your profile settings
                </p>
              </div>
            ) : (
              <>
                <Input
                  id="forum-username"
                  value={newForumUsername}
                  onChange={(e) => setNewForumUsername(e.target.value)}
                  placeholder="Choose a username for the forum"
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  This username will be visible on the forum. Use 3-20 characters: letters, numbers, underscores, or hyphens.
                </p>
              </>
            )}
          </div>

          {/* Remember Decision */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberDecision}
              onCheckedChange={(checked) => setRememberDecision(checked === true)}
              disabled={isProcessing}
            />
            <Label htmlFor="remember" className="text-sm cursor-pointer">
              Remember this decision (skip this screen next time)
            </Label>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={isProcessing}
            className="flex-1"
          >
            Deny
          </Button>
          <Button
            onClick={() => handleApprove(effectiveForumUsername, rememberDecision)}
            disabled={isProcessing || (needsForumUsername && !newForumUsername.trim())}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Authorize'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
