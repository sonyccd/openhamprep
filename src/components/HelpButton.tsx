import { useState } from 'react';
import { HelpCircle, Keyboard, Bug, Lightbulb, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
export function HelpButton() {
  const [open, setOpen] = useState(false);
  return <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="default" size="icon" className="fixed bottom-4 right-4 h-9 w-9 rounded-full shadow-lg z-50 [&_svg]:size-7" onClick={() => setOpen(true)} aria-label="Open help dialog">
            <HelpCircle aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Help & Shortcuts (?)</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
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

          <Tabs defaultValue="shortcuts" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shortcuts" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" aria-hidden="true" />
                Shortcuts
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                Feedback
              </TabsTrigger>
            </TabsList>

              <TabsContent value="shortcuts" className="mt-4 space-y-4">
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

              <TabsContent value="feedback" className="mt-4 space-y-4 min-h-[280px]">
                <p className="text-sm text-muted-foreground">
                  Found a bug or have an idea to improve the app? Let us know on GitHub!
                </p>

                <div className="space-y-3">
                  <a href="https://github.com/sonyccd/rars-test-prep/issues/new?template=bug_report.md" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10 text-destructive">
                      <Bug className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">Report a Bug</div>
                      <div className="text-sm text-muted-foreground">
                        Something not working? Let us know
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </a>

                  <a href="https://github.com/sonyccd/rars-test-prep/issues/new?template=feature_request.md" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                      <Lightbulb className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">Request a Feature</div>
                      <div className="text-sm text-muted-foreground">
                        Have an idea? We'd love to hear it
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </a>
                </div>
              </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>;
}