import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGlossary } from "@/components/admin/AdminGlossary";
import { AdminQuestions } from "@/components/admin/AdminQuestions";
import { AdminStats } from "@/components/admin/AdminStats";
import { Loader2, ShieldAlert, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import { TestType } from "@/components/DashboardSidebar";
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
  const [activeSection, setActiveSection] = useState<"exam" | "glossary">("exam");
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
  return <AppLayout currentView="dashboard" onViewChange={handleViewChange} selectedTest={sidebarTest} onTestChange={setSidebarTest}>
      <div className="flex-1 p-6 md:p-8 flex flex-col h-full overflow-hidden">
        <div className="max-w-6xl mx-auto w-full flex flex-col flex-1 min-h-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin </h1>
            <p className="text-muted-foreground mt-2">Manage glossary terms, questions, and learning resources</p>
          </div>

          {/* Section Toggle */}
          <div className="flex gap-4 mb-6">
            <button onClick={() => setActiveSection("exam")} className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${activeSection === "exam" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`}>
              <div className="font-semibold text-foreground mb-1">Exam Content</div>
              <p className="text-sm text-muted-foreground">
                Statistics and questions for each license class
              </p>
            </button>
            <button onClick={() => setActiveSection("glossary")} className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${activeSection === "glossary" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`}>
              <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
                <BookOpen className="w-4 h-4" />
                Glossary Terms
                <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded">All Exams</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Shared vocabulary terms across all license classes
              </p>
            </button>
          </div>

          {activeSection === "exam" ? <Tabs value={activeTab} onValueChange={value => {
          setActiveTab(value);
          if (value !== "questions") setLinkQuestionId("");
        }} className="w-full flex-1 flex flex-col min-h-0">
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

              <TabsContent value="stats" className="flex-1 min-h-0 overflow-auto">
                <AdminStats testType={adminExamType} onAddLinkToQuestion={handleAddLinkToQuestion} />
              </TabsContent>

              <TabsContent value="questions" className="flex-1 min-h-0 flex flex-col">
                <AdminQuestions testType={adminExamType} highlightQuestionId={linkQuestionId} />
              </TabsContent>
            </Tabs> : <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Glossary Terms</h2>
                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                  Shared across all exams
                </span>
              </div>
              <AdminGlossary />
            </div>}
        </div>
      </div>
    </AppLayout>;
}