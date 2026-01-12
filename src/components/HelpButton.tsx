import { useState } from 'react';
import { HelpCircle, Keyboard, Lightbulb, ExternalLink, Activity, Bug, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
interface ShortcutItem {
  keys: string[];
  description: string;
}
interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}
const shortcutGroups: ShortcutGroup[] = [{
  title: 'Answering Questions',
  shortcuts: [{
    keys: ['A'],
    description: 'Select answer A'
  }, {
    keys: ['B'],
    description: 'Select answer B'
  }, {
    keys: ['C'],
    description: 'Select answer C'
  }, {
    keys: ['D'],
    description: 'Select answer D'
  }]
}, {
  title: 'Navigation',
  shortcuts: [{
    keys: ['→'],
    description: 'Next question'
  }, {
    keys: ['←'],
    description: 'Previous question'
  }, {
    keys: ['S'],
    description: 'Skip question (Random Practice)'
  }, {
    keys: ['Esc'],
    description: 'Go back / Close'
  }]
}, {
  title: 'Tools',
  shortcuts: [{
    keys: ['?'],
    description: 'Show this help dialog'
  }]
}];
type FormType = 'bug' | 'feedback' | null;

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

const buildForumUrl = (type: 'bug' | 'feature', title: string, description: string) => {
  const tag = type === 'bug' ? 'bug' : 'feature';
  const truncatedTitle = title.slice(0, MAX_TITLE_LENGTH);
  const truncatedDescription = description.slice(0, MAX_DESCRIPTION_LENGTH);
  const bodyTemplate = type === 'bug'
    ? `**Issue Description:**\n${truncatedDescription}\n\n**Steps to Reproduce:**\n1. \n2. \n3. \n\n**Expected Behavior:**\n\n**Actual Behavior:**\n`
    : `**Feedback:**\n${truncatedDescription}\n\n**Why this would help:**\n`;

  const params = new URLSearchParams({
    category: 'feedback',
    title: truncatedTitle,
    tags: tag,
    body: bodyTemplate
  });

  return `https://forum.openhamprep.com/new-topic?${params.toString()}`;
};

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');

  const resetForms = () => {
    setActiveForm(null);
    setBugTitle('');
    setBugDescription('');
    setFeedbackTitle('');
    setFeedbackDescription('');
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForms();
    }
  };

  const handleSubmitBug = () => {
    const url = buildForumUrl('bug', bugTitle, bugDescription);
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (newWindow) {
      toast({
        title: 'Opening forum',
        description: 'Complete your bug report in the new tab.',
      });
      resetForms();
    } else {
      toast({
        title: 'Popup blocked',
        description: 'Please allow popups to submit your report.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitFeedback = () => {
    const url = buildForumUrl('feature', feedbackTitle, feedbackDescription);
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (newWindow) {
      toast({
        title: 'Opening forum',
        description: 'Complete your feedback in the new tab.',
      });
      resetForms();
    } else {
      toast({
        title: 'Popup blocked',
        description: 'Please allow popups to submit your feedback.',
        variant: 'destructive',
      });
    }
  };

  return <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="default" size="icon" className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50 [&_svg]:size-8" onClick={() => setOpen(true)} aria-label="Open help dialog">
            <HelpCircle aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Help & Shortcuts (?)</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-lg min-h-[420px]" aria-describedby="help-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
              Help & Support
            </DialogTitle>
            <DialogDescription id="help-description">
              Keyboard shortcuts and ways to get help
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="feedback" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                Feedback
              </TabsTrigger>
              <TabsTrigger value="shortcuts" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" aria-hidden="true" />
                Shortcuts
              </TabsTrigger>
            </TabsList>

              <TabsContent value="shortcuts" className="mt-4 space-y-4 min-h-[340px]">
                {shortcutGroups.map(group => <div key={group.title}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      {group.title}
                    </h3>
                    <div className="space-y-1.5">
                      {group.shortcuts.map((shortcut, index) => <div key={index} className="flex items-center justify-between py-1">
                          <span className="text-sm text-foreground">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIndex) => <kbd key={keyIndex} className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-mono font-medium bg-muted border border-border rounded">
                                {key}
                              </kbd>)}
                          </div>
                        </div>)}
                    </div>
                  </div>)}
              </TabsContent>

              <TabsContent value="feedback" className="mt-4 space-y-4 min-h-[340px]">
                {activeForm === null ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Found a bug or have an idea to improve the app? Let us know on our community forum!
                    </p>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setActiveForm('bug')}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10 text-destructive">
                          <Bug className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Report a Bug</div>
                          <div className="text-sm text-muted-foreground">
                            Something not working? Let us know
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveForm('feedback')}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                          <Lightbulb className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Give Feedback</div>
                          <div className="text-sm text-muted-foreground">
                            Share ideas or suggest features
                          </div>
                        </div>
                      </button>

                      <a href="https://openhamprep.statuspage.io/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-success/10 text-success">
                          <Activity className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">System Status</div>
                          <div className="text-sm text-muted-foreground">
                            Check if services are running smoothly
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span className="sr-only">(opens in new window)</span>
                      </a>
                    </div>
                  </>
                ) : activeForm === 'bug' ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setActiveForm(null)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      Back to options
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive/10 text-destructive">
                        <Bug className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <h3 className="font-medium text-foreground">Report a Bug</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="bug-title">Title</Label>
                        <Input
                          id="bug-title"
                          placeholder="Brief summary of the issue"
                          value={bugTitle}
                          onChange={(e) => setBugTitle(e.target.value)}
                          maxLength={MAX_TITLE_LENGTH}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="bug-description">Description</Label>
                        <Textarea
                          id="bug-description"
                          placeholder="What happened? What were you trying to do?"
                          rows={4}
                          value={bugDescription}
                          onChange={(e) => setBugDescription(e.target.value)}
                          maxLength={MAX_DESCRIPTION_LENGTH}
                        />
                      </div>

                      <Button
                        onClick={handleSubmitBug}
                        disabled={!bugTitle.trim() || !bugDescription.trim()}
                        variant="destructive"
                        className="w-full"
                      >
                        Submit to Forum
                        <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setActiveForm(null)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      Back to options
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                        <Lightbulb className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <h3 className="font-medium text-foreground">Give Feedback</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="feedback-title">Title</Label>
                        <Input
                          id="feedback-title"
                          placeholder="Brief summary of your idea"
                          value={feedbackTitle}
                          onChange={(e) => setFeedbackTitle(e.target.value)}
                          maxLength={MAX_TITLE_LENGTH}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="feedback-description">Description</Label>
                        <Textarea
                          id="feedback-description"
                          placeholder="Tell us more about your idea or suggestion"
                          rows={4}
                          value={feedbackDescription}
                          onChange={(e) => setFeedbackDescription(e.target.value)}
                          maxLength={MAX_DESCRIPTION_LENGTH}
                        />
                      </div>

                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={!feedbackTitle.trim() || !feedbackDescription.trim()}
                        className="w-full"
                      >
                        Submit to Forum
                        <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>;
}