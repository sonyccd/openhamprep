import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGlossary } from "@/components/admin/AdminGlossary";
import { AdminQuestions } from "@/components/admin/AdminQuestions";
import { AdminExamSessions } from "@/components/admin/AdminExamSessions";
import { AdminTopics } from "@/components/admin/AdminTopics";
import { AdminLessons } from "@/components/admin/AdminLessons";
import { AdminChapters } from "@/components/admin/AdminChapters";
import { AdminHamRadioTools } from "@/components/admin/AdminHamRadioTools";
import { DiscourseSyncDashboard } from "@/components/admin/DiscourseSyncDashboard";
import { AdminAlerts } from "@/components/admin/AdminAlerts";
import { AdminAlertRules } from "@/components/admin/AdminAlertRules";
import { useUnacknowledgedAlertCount } from "@/hooks/useAlerts";
import { Loader2, ShieldAlert, BookText, MapPin, MessageSquare, FileQuestion, Book, Wrench, Bell, GraduationCap } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { TestType } from "@/types/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
export default function Admin() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    isAdmin,
    isLoading: adminLoading
  } = useAdmin();
  const navigate = useNavigate();
  const [sidebarTest, setSidebarTest] = useState<TestType>('technician');
  const [adminExamType, setAdminExamType] = useState<TestType>('technician');
  const [activeSection, setActiveSection] = useState<"exam" | "glossary" | "sessions" | "learning" | "chapters" | "tools" | "discourse" | "alerts">("exam");
  const { data: unacknowledgedCount = 0 } = useUnacknowledgedAlertCount();
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  if (authLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  if (!isAdmin) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>;
  }
  const handleViewChange = (view: string) => {
    if (view === 'dashboard') {
      navigate('/dashboard');
    }
  };

  // Questions/Glossary need fixed viewport with internal scroll
  const needsFixedHeight = activeSection === "glossary" || activeSection === "sessions" || activeSection === "learning" || activeSection === "chapters" || activeSection === "tools" || activeSection === "discourse" || activeSection === "alerts" || activeSection === "exam";

  return <AppLayout currentView="dashboard" onViewChange={handleViewChange} selectedTest={sidebarTest} onTestChange={setSidebarTest}>
      <div className={`flex-1 p-6 md:p-8 flex flex-col ${needsFixedHeight ? 'h-full overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={`max-w-6xl mx-auto w-full flex flex-col ${needsFixedHeight ? 'flex-1 min-h-0' : ''}`}>
          {/* Compact Header with Inline Navigation */}
          <div className="flex items-center justify-between mb-6 shrink-0 flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-foreground">Admin</h1>

            {/* Compact Section Navigation */}
            <nav className="flex items-center bg-muted/50 rounded-lg p-1 gap-1">
              <button
                onClick={() => setActiveSection("exam")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeSection === "exam"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                <span className="hidden sm:inline">Questions</span>
              </button>
              <button
                onClick={() => setActiveSection("glossary")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeSection === "glossary"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <BookText className="w-4 h-4" />
                <span className="hidden sm:inline">Glossary</span>
              </button>
              <button
                onClick={() => setActiveSection("sessions")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeSection === "sessions"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Sessions</span>
              </button>
              <button
                onClick={() => setActiveSection("learning")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeSection === "learning"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Learning</span>
              </button>
              <button
                onClick={() => setActiveSection("chapters")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeSection === "chapters"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Book className="w-4 h-4" />
                <span className="hidden sm:inline">Chapters</span>
              </button>
              <button
                onClick={() => setActiveSection("tools")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeSection === "tools"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span className="hidden sm:inline">Tools</span>
              </button>
              <button
                onClick={() => setActiveSection("discourse")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeSection === "discourse"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Discourse</span>
              </button>
              <button
                onClick={() => setActiveSection("alerts")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all relative ${
                  activeSection === "alerts"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Alerts</span>
                {unacknowledgedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {activeSection === "exam" ? (
            <div className="w-full flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-end gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Exam:</span>
                <ToggleGroup type="single" value={adminExamType} onValueChange={value => value && setAdminExamType(value as TestType)} className="bg-muted rounded-lg p-1">
                  <ToggleGroupItem value="technician" className="text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Tech
                  </ToggleGroupItem>
                  <ToggleGroupItem value="general" className="text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    General
                  </ToggleGroupItem>
                  <ToggleGroupItem value="extra" className="text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Extra
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <AdminQuestions testType={adminExamType} />
            </div>
          ) : activeSection === "glossary" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AdminGlossary />
              </div>
            ) : activeSection === "sessions" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AdminExamSessions />
              </div>
            ) : activeSection === "learning" ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                <Tabs key="learning-tabs" defaultValue="lessons" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="lessons">Lessons</TabsTrigger>
                    <TabsTrigger value="topics">Topics</TabsTrigger>
                  </TabsList>
                  <TabsContent value="lessons" className="mt-0">
                    <AdminLessons />
                  </TabsContent>
                  <TabsContent value="topics" className="mt-0">
                    <AdminTopics />
                  </TabsContent>
                </Tabs>
              </div>
            ) : activeSection === "chapters" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AdminChapters />
              </div>
            ) : activeSection === "tools" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AdminHamRadioTools />
              </div>
            ) : activeSection === "alerts" ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                <Tabs key="alerts-tabs" defaultValue="alerts" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="rules">Alert Rules</TabsTrigger>
                  </TabsList>
                  <TabsContent value="alerts" className="mt-0">
                    <AdminAlerts />
                  </TabsContent>
                  <TabsContent value="rules" className="mt-0">
                    <AdminAlertRules />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                <DiscourseSyncDashboard />
              </div>
            )}
        </div>
      </div>
    </AppLayout>;
}