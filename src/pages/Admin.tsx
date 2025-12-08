import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGlossary } from "@/components/admin/AdminGlossary";
import { AdminQuestions } from "@/components/admin/AdminQuestions";

import { AdminStats } from "@/components/admin/AdminStats";
import { Loader2, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { TestType } from "@/components/DashboardSidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

  const testTypeLabels = {
    technician: 'Technician',
    general: 'General',
    extra: 'Extra',
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="glossary">Glossary Terms</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
              </TabsList>

              {activeTab !== "glossary" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Exam:</span>
                  <ToggleGroup 
                    type="single" 
                    value={selectedTest} 
                    onValueChange={(value) => value && setSelectedTest(value as TestType)}
                    className="bg-muted rounded-lg p-1"
                  >
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
              )}
            </div>

            <TabsContent value="stats">
              <AdminStats testType={selectedTest} onAddLinkToQuestion={handleAddLinkToQuestion} />
            </TabsContent>

            <TabsContent value="glossary">
              <AdminGlossary />
            </TabsContent>

            <TabsContent value="questions">
              <AdminQuestions testType={selectedTest} highlightQuestionId={linkQuestionId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}