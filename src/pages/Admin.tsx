import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGlossary } from "@/components/admin/AdminGlossary";
import { AdminQuestions } from "@/components/admin/AdminQuestions";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminExamSessions } from "@/components/admin/AdminExamSessions";
import { AdminTopics } from "@/components/admin/AdminTopics";
import { AdminLessons } from "@/components/admin/AdminLessons";
import { AdminChapters } from "@/components/admin/AdminChapters";
import { DiscourseSyncDashboard } from "@/components/admin/DiscourseSyncDashboard";
import { Loader2, ShieldAlert, BookText, MapPin, FileText, MessageSquare, FileQuestion, Book, Route } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("stats");
  const [activeSection, setActiveSection] = useState<"exam" | "glossary" | "sessions" | "topics" | "lessons" | "chapters" | "discourse">("exam");
  const [linkQuestionId, setLinkQuestionId] = useState("");
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
  const handleAddLinkToQuestion = (questionId: string) => {
    setLinkQuestionId(questionId);
    setActiveSection("exam");
    setActiveTab("questions");
  };
  const testTypeLabels = {
    technician: 'Technician',
    general: 'General',
    extra: 'Extra'
  };
  // Stats tab needs full page scroll, Questions/Glossary need fixed viewport with internal scroll
  const needsFixedHeight = activeSection === "glossary" || activeSection === "sessions" || activeSection === "topics" || activeSection === "lessons" || activeSection === "chapters" || activeSection === "discourse" || (activeSection === "exam" && activeTab === "questions");

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
                onClick={() => setActiveSection("topics")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeSection === "topics"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Topics</span>
              </button>
              <button
                onClick={() => setActiveSection("lessons")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeSection === "lessons"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Route className="w-4 h-4" />
                <span className="hidden sm:inline">Lessons</span>
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
            </nav>
          </div>

          {activeSection === "exam" ? <Tabs value={activeTab} onValueChange={value => {
          setActiveTab(value);
          if (value !== "questions") setLinkQuestionId("");
        }} className={`w-full ${needsFixedHeight ? 'flex-1 flex flex-col min-h-0' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <TabsList className="grid w-full sm:w-auto grid-cols-2">
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
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
              </div>

              <TabsContent value="stats" className="mt-0">
                <AdminStats testType={adminExamType} onAddLinkToQuestion={handleAddLinkToQuestion} />
              </TabsContent>

              <TabsContent value="questions" className="flex-1 min-h-0 flex flex-col">
                <AdminQuestions testType={adminExamType} highlightQuestionId={linkQuestionId} />
              </TabsContent>
            </Tabs> : activeSection === "glossary" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AdminGlossary />
              </div>
            ) : activeSection === "sessions" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AdminExamSessions />
              </div>
            ) : activeSection === "topics" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AdminTopics />
              </div>
            ) : activeSection === "lessons" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AdminLessons />
              </div>
            ) : activeSection === "chapters" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <AdminChapters />
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