import { useState } from 'react';
import { format, addMonths } from 'date-fns';
import { MapPin, Calendar, List, Map, Clock, Phone, Mail, Users, Target, Loader2, ChevronLeft, ChevronRight, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ExamSessionMap } from './ExamSessionMap';
import { useExamSessions, useSaveTargetExam, useUserTargetExam, useRemoveTargetExam, type ExamSession } from '@/hooks/useExamSessions';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/ui/page-container';
const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

// Map US states to timezone abbreviations (simplified - uses primary timezone for each state)
const STATE_TIMEZONES: Record<string, string> = {
  'AL': 'CT',
  'AK': 'AKT',
  'AZ': 'MT',
  'AR': 'CT',
  'CA': 'PT',
  'CO': 'MT',
  'CT': 'ET',
  'DE': 'ET',
  'FL': 'ET',
  'GA': 'ET',
  'HI': 'HT',
  'ID': 'MT',
  'IL': 'CT',
  'IN': 'ET',
  'IA': 'CT',
  'KS': 'CT',
  'KY': 'ET',
  'LA': 'CT',
  'ME': 'ET',
  'MD': 'ET',
  'MA': 'ET',
  'MI': 'ET',
  'MN': 'CT',
  'MS': 'CT',
  'MO': 'CT',
  'MT': 'MT',
  'NE': 'CT',
  'NV': 'PT',
  'NH': 'ET',
  'NJ': 'ET',
  'NM': 'MT',
  'NY': 'ET',
  'NC': 'ET',
  'ND': 'CT',
  'OH': 'ET',
  'OK': 'CT',
  'OR': 'PT',
  'PA': 'ET',
  'RI': 'ET',
  'SC': 'ET',
  'SD': 'CT',
  'TN': 'CT',
  'TX': 'CT',
  'UT': 'MT',
  'VT': 'ET',
  'VA': 'ET',
  'WA': 'PT',
  'WV': 'ET',
  'WI': 'CT',
  'WY': 'MT'
};
const getTimezoneLabel = (state: string): string => {
  const tz = STATE_TIMEZONES[state];
  if (!tz) return 'local';
  const labels: Record<string, string> = {
    'ET': 'Eastern',
    'CT': 'Central',
    'MT': 'Mountain',
    'PT': 'Pacific',
    'AKT': 'Alaska',
    'HT': 'Hawaii'
  };
  return labels[tz] || 'local';
};
const STUDY_INTENSITIES = [{
  value: 'light',
  label: 'Light',
  description: '10 questions/day, 1 test/week'
}, {
  value: 'moderate',
  label: 'Moderate',
  description: '25 questions/day, 2 tests/week'
}, {
  value: 'intensive',
  label: 'Intensive',
  description: '50 questions/day, 3 tests/week'
}] as const;
export const ExamSessionSearch = () => {
  const {
    user
  } = useAuth();
  const [zipCode, setZipCode] = useState('');
  const [state, setState] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showAllOnMap, setShowAllOnMap] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [studyIntensity, setStudyIntensity] = useState<'light' | 'moderate' | 'intensive'>('moderate');
  const [page, setPage] = useState(1);
  const [walkInsOnly, setWalkInsOnly] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const pageSize = 20;
  const {
    data,
    isLoading
  } = useExamSessions({
    startDate,
    endDate,
    state: state || undefined,
    zip: zipCode || undefined,
    walkInsOnly,
    page,
    pageSize
  });
  const sessions = data?.sessions ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const {
    data: userTarget
  } = useUserTargetExam(user?.id);
  const saveTargetMutation = useSaveTargetExam();
  const removeTargetMutation = useRemoveTargetExam();

  // Sessions are now filtered server-side
  const displayedSessions = sessions;

  // Reset to page 1 when filters change
  const handleStateChange = (v: string) => {
    setState(v === 'all' ? '' : v);
    setPage(1);
  };
  const handleStartDateChange = (v: string) => {
    setStartDate(v);
    setPage(1);
  };
  const handleEndDateChange = (v: string) => {
    setEndDate(v);
    setPage(1);
  };
  const handleZipChange = (v: string) => {
    setZipCode(v.replace(/\D/g, '').slice(0, 5));
    setPage(1);
  };
  const handleWalkInsChange = (checked: boolean) => {
    setWalkInsOnly(checked);
    setPage(1);
  };
  const handleSaveTarget = () => {
    if (!user || !selectedSession) return;
    saveTargetMutation.mutate({
      userId: user.id,
      examSessionId: selectedSession.id,
      studyIntensity
    });
    setShowSaveDialog(false);
  };
  const handleRemoveTarget = () => {
    if (!user) return;
    removeTargetMutation.mutate(user.id);
  };
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  return (
    <PageContainer width="wide" className="flex flex-col" contentClassName="flex flex-col gap-4 min-h-0">
      {/* Current Target Display */}
      {userTarget && <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Your Target Exam</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemoveTarget} disabled={removeTargetMutation.isPending}>
                Remove
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">{userTarget.exam_session?.location_name || userTarget.exam_session?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {userTarget.exam_session?.city}, {userTarget.exam_session?.state} • {formatDate(userTarget.exam_session?.exam_date || '')}
                </p>
              </div>
              <Badge variant="secondary">
                {STUDY_INTENSITIES.find(i => i.value === userTarget.study_intensity)?.label} Study Plan
              </Badge>
            </div>
          </CardContent>
        </Card>}

      {/* Search Filters - Collapsible on mobile */}
      <Card>
        <CardHeader
          className="cursor-pointer md:cursor-default"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Find Exam Sessions
              </CardTitle>
              <CardDescription className="hidden md:block">
                Search for amateur radio exam sessions near you
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={(e) => {
                e.stopPropagation();
                setFiltersExpanded(!filtersExpanded);
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {filtersExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>
          {/* Mobile summary of active filters when collapsed */}
          {!filtersExpanded && (state || zipCode || walkInsOnly) && (
            <div className="flex flex-wrap gap-2 mt-2 md:hidden">
              {zipCode && <Badge variant="secondary" className="text-xs">ZIP: {zipCode}</Badge>}
              {state && <Badge variant="secondary" className="text-xs">{state}</Badge>}
              {walkInsOnly && <Badge variant="secondary" className="text-xs">Walk-ins only</Badge>}
            </div>
          )}
        </CardHeader>
        <CardContent className={`${filtersExpanded ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input id="zip" placeholder="Enter ZIP code" value={zipCode} onChange={e => handleZipChange(e.target.value)} maxLength={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={state || 'all'} onValueChange={handleStateChange}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">From Date</Label>
              <Input id="start-date" type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">To Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={e => handleEndDateChange(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="walk-ins" checked={walkInsOnly} onCheckedChange={handleWalkInsChange} />
            <Label htmlFor="walk-ins" className="cursor-pointer">Walk-ins allowed only</Label>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              
              <CardDescription>
                {zipCode ? `Showing sessions near ZIP ${zipCode} • ` : ''}
                Page {page} of {totalPages}
              </CardDescription>
            </div>
            <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'list' | 'map')}>
              <TabsList>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {viewMode === 'map' && <div className="flex items-center gap-2 mt-2">
              <Button variant={showAllOnMap ? 'default' : 'outline'} size="sm" onClick={() => setShowAllOnMap(true)}>
                Show All
              </Button>
              <Button variant={!showAllOnMap ? 'default' : 'outline'} size="sm" onClick={() => setShowAllOnMap(false)}>
                Search Results Only
              </Button>
            </div>}
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {isLoading ? <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div> : viewMode === 'map' ? <ExamSessionMap sessions={displayedSessions} selectedSession={selectedSession} onSessionSelect={setSelectedSession} hasFilters={!!state || !!zipCode} /> : <>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {sessions.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                      No exam sessions found. Try adjusting your search criteria.
                    </div> : sessions.map(session => <Card key={session.id} className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedSession?.id === session.id ? 'border-primary bg-primary/5' : ''}`} onClick={() => setSelectedSession(session)}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">
                                  {session.location_name || session.title || 'Exam Session'}
                                </h4>
                                {session.walk_ins_allowed && <Badge variant="secondary" className="text-xs">
                                    Walk-ins OK
                                  </Badge>}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {session.address && `${session.address}, `}
                                  {session.city}, {session.state} {session.zip}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(session.exam_date)}</span>
                                </div>
                                {session.exam_time && <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{session.exam_time} {getTimezoneLabel(session.state)}</span>
                                  </div>}
                              </div>
                              {session.sponsor && <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  <span>{session.sponsor}</span>
                                </div>}
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              {session.phone && <a href={`tel:${session.phone}`} className="flex items-center gap-1 text-sm text-primary hover:underline" onClick={e => e.stopPropagation()}>
                                  <Phone className="h-4 w-4" />
                                  {session.phone}
                                </a>}
                              {session.email && <a href={`mailto:${session.email}`} className="flex items-center gap-1 text-sm text-primary hover:underline" onClick={e => e.stopPropagation()}>
                                  <Mail className="h-4 w-4" />
                                  Contact
                                </a>}
                              {user && selectedSession?.id === session.id && <Button size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); setShowSaveDialog(true); }}>
                                  <Target className="h-4 w-4 mr-2" />
                                  Set as Target
                                </Button>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>)}
                </div>
              </ScrollArea>
              {/* Pagination Controls - Always visible at bottom */}
              {totalPages > 1 && <div className="flex items-center justify-between pt-4 border-t mt-4 flex-wrap gap-4 shrink-0">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(1)} disabled={page <= 1 || isLoading} aria-label="First page">
                      <ChevronLeft className="h-4 w-4" />
                      <ChevronLeft className="h-4 w-4 -ml-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || isLoading} aria-label="Previous page">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Page number buttons */}
                    {Array.from({
                length: Math.min(5, totalPages)
              }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setPage(pageNum)} disabled={isLoading}>
                          {pageNum}
                        </Button>;
              })}

                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading} aria-label="Next page">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(totalPages)} disabled={page >= totalPages || isLoading} aria-label="Last page">
                      <ChevronRight className="h-4 w-4" />
                      <ChevronRight className="h-4 w-4 -ml-3" />
                    </Button>
                  </div>
                </div>}
            </>}
        </CardContent>
      </Card>


      {/* Save Target Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Target Exam Date</DialogTitle>
            <DialogDescription>
              Choose your study intensity. Your weekly goals will be adjusted to help you prepare.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={studyIntensity} onValueChange={v => setStudyIntensity(v as 'light' | 'moderate' | 'intensive')} className="space-y-3">
              {STUDY_INTENSITIES.map(intensity => <div key={intensity.value} className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${studyIntensity === intensity.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}>
                  <RadioGroupItem value={intensity.value} id={intensity.value} />
                  <Label htmlFor={intensity.value} className="flex-1 cursor-pointer">
                    <span className="font-medium">{intensity.label}</span>
                    <p className="text-sm text-muted-foreground">{intensity.description}</p>
                  </Label>
                </div>)}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTarget} disabled={saveTargetMutation.isPending}>
              {saveTargetMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};