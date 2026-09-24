import { Icon } from "@/components/ohp/Icon";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { ShieldAlert } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useUnacknowledgedAlertCount } from "@/hooks/useAlerts";
import { AppLayout } from "@/components/AppLayout";
import { AdminGlossary } from "@/components/admin/AdminGlossary";
import { AdminQuestions } from "@/components/admin/AdminQuestions";
import { AdminTopics } from "@/components/admin/AdminTopics";
import { AdminLessons } from "@/components/admin/AdminLessons";
import { AdminChapters } from "@/components/admin/AdminChapters";
import { AdminHamRadioTools } from "@/components/admin/AdminHamRadioTools";
import { DiscourseSyncDashboard } from "@/components/admin/DiscourseSyncDashboard";
import { AdminAlerts } from "@/components/admin/AdminAlerts";
import { AdminAlertRules } from "@/components/admin/AdminAlertRules";
import { TestType } from "@/types/navigation";
import { AdminSectionNav } from "./admin/AdminSectionNav";
import { AdminSectionTabs } from "./admin/AdminSectionTabs";
import type { AdminSection } from "./admin/adminSections";

const EXAM_TYPES: { value: TestType; label: string }[] = [
  { value: "technician", label: "Tech" },
  { value: "general", label: "General" },
  { value: "extra", label: "Extra" },
];

/** Every section scrolls inside a fixed viewport rather than growing the page. */
const fillSx = { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } as const;

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [sidebarTest, setSidebarTest] = useState<TestType>("technician");
  const [adminExamType, setAdminExamType] = useState<TestType>("technician");
  const [activeSection, setActiveSection] = useState<AdminSection>("exam");
  const { data: unacknowledgedCount = 0 } = useUnacknowledgedAlertCount();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <Box
        sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}
        role="status"
        aria-label="Loading admin"
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          gap: 2,
        }}
      >
        <Icon icon={ShieldAlert} size={64} sx={{ color: "error.main" }} />
        <Typography component="h1" sx={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Access Denied
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>You do not have permission to access this page.</Typography>
      </Box>
    );
  }

  const handleViewChange = (view: string) => {
    if (view === "dashboard") navigate("/dashboard");
  };

  const sections: Record<AdminSection, React.ReactNode> = {
    exam: (
      <Box sx={{ ...fillSx, width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1, mb: 3 }}>
          <Typography component="span" sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
            Exam:
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={adminExamType}
            onChange={(_e, next: TestType | null) => next && setAdminExamType(next)}
            aria-label="Exam"
            sx={{ bgcolor: "muted", borderRadius: "8px", p: 0.5 }}
          >
            {EXAM_TYPES.map(({ value, label }) => (
              <ToggleButton
                key={value}
                value={value}
                sx={{
                  border: 0,
                  borderRadius: "6px !important",
                  px: 1.5,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": { bgcolor: "primary.main" },
                  },
                }}
              >
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <AdminQuestions testType={adminExamType} />
      </Box>
    ),
    glossary: <AdminGlossary />,
    learning: (
      <AdminSectionTabs
        id="admin-learning"
        ariaLabel="Learning sections"
        tabs={[
          { label: "Lessons", panel: <AdminLessons /> },
          { label: "Topics", panel: <AdminTopics /> },
        ]}
      />
    ),
    chapters: <AdminChapters />,
    tools: <AdminHamRadioTools />,
    discourse: <DiscourseSyncDashboard />,
    alerts: (
      <AdminSectionTabs
        id="admin-alerts"
        ariaLabel="Alert sections"
        tabs={[
          { label: "Alerts", panel: <AdminAlerts /> },
          { label: "Alert Rules", panel: <AdminAlertRules /> },
        ]}
      />
    ),
  };

  // The sections that hold their own tablists scroll as a whole.
  const scrolls = activeSection === "learning" || activeSection === "alerts" || activeSection === "discourse";

  return (
    <AppLayout
      currentView="dashboard"
      onViewChange={handleViewChange}
      selectedTest={sidebarTest}
      onTestChange={setSidebarTest}
    >
      <Box sx={{ flex: 1, p: { xs: 3, md: 4 }, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Box sx={{ maxWidth: 1152, mx: "auto", width: "100%", ...fillSx }}>
          <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexShrink: 0, flexWrap: "wrap", gap: 2 }}
          >
            <Typography component="h1" sx={{ fontSize: "1.5rem", fontWeight: 700 }}>
              Admin
            </Typography>
            <AdminSectionNav
              value={activeSection}
              onChange={setActiveSection}
              unacknowledgedCount={unacknowledgedCount}
            />
          </Box>

          <Box sx={{ ...fillSx, ...(scrolls && { overflowY: "auto" }) }}>{sections[activeSection]}</Box>
        </Box>
      </Box>
    </AppLayout>
  );
}
