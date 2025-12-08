import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGlossary } from "@/components/admin/AdminGlossary";
import { AdminQuestions } from "@/components/admin/AdminQuestions";
import { AdminLinks } from "@/components/admin/AdminLinks";
import { AdminStats } from "@/components/admin/AdminStats";
import { Loader2, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { TestType } from "@/components/DashboardSidebar";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [selectedTest, setSelectedTest] = useState<TestType>('technician');
  const [activeTab, setActiveTab] = useState("stats");
  const [linkQuestionId, setLinkQuestionId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  const handleViewChange = (view: string) => {
    if (view === 'dashboard') {
      navigate('/dashboard');
    }
  };

  const handleAddLinkToQuestion = (questionId: string) => {
    setLinkQuestionId(questionId);
    setActiveTab("questions");
  };

  return (
    <AppLayout 
      currentView="dashboard"
      onViewChange={handleViewChange}
      selectedTest={selectedTest}
      onTestChange={setSelectedTest}
    >
      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage glossary terms, questions, and learning resources</p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            if (value !== "questions") setLinkQuestionId("");
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="glossary">Glossary Terms</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="links">Question Links</TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <AdminStats testType={selectedTest} onAddLinkToQuestion={handleAddLinkToQuestion} />
            </TabsContent>

            <TabsContent value="glossary">
              <AdminGlossary />
            </TabsContent>

            <TabsContent value="questions">
              <AdminQuestions testType={selectedTest} highlightQuestionId={linkQuestionId} />
            </TabsContent>

            <TabsContent value="links">
              <AdminLinks testType={selectedTest} initialQuestionId={linkQuestionId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
