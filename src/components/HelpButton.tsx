import { Icon } from "@/components/ohp/Icon";
import { useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { visuallyHidden } from "@mui/utils";
import { HelpCircle, Keyboard, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { FeedbackOptions } from "./help/FeedbackOptions";
import { ForumReportForm } from "./help/ForumReportForm";
import { HelpTriggers } from "./help/HelpTriggers";
import { ShortcutsPanel } from "./help/ShortcutsPanel";
import { buildForumUrl, REPORT_COPY } from "./help/helpForumUrl";
import type { ReportKind } from "./help/helpForumUrl";

type HelpTab = "feedback" | "shortcuts";

const EMPTY_REPORT = { title: "", description: "" };

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<HelpTab>("feedback");
  const [activeForm, setActiveForm] = useState<ReportKind | null>(null);
  const [reports, setReports] = useState<Record<ReportKind, { title: string; description: string }>>({
    bug: EMPTY_REPORT,
    feedback: EMPTY_REPORT,
  });

  const resetForms = () => {
    setActiveForm(null);
    setReports({ bug: EMPTY_REPORT, feedback: EMPTY_REPORT });
  };

  const handleClose = () => {
    setOpen(false);
    resetForms();
  };

  const updateReport = (kind: ReportKind, field: "title" | "description") => (value: string) =>
    setReports((prev) => ({ ...prev, [kind]: { ...prev[kind], [field]: value } }));

  const handleSubmit = (kind: ReportKind) => {
    const { title, description } = reports[kind];
    window.open(buildForumUrl(kind, title, description), "_blank", "noopener,noreferrer");
    toast("Opening forum", { description: REPORT_COPY[kind].toast });
    resetForms();
  };

  // Keyboard shortcuts are irrelevant on touch devices, so on mobile the tab
  // bar goes and the feedback options show directly.
  const showTabs = !isMobile;
  const panel = showTabs ? tab : "feedback";

  return (
    <>
      <HelpTriggers onOpen={() => setOpen(true)} />

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="help-dialog-title"
        aria-describedby="help-dialog-description"
      >
        <DialogTitle id="help-dialog-title" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon icon={HelpCircle} size={20} />
          Help & Support
        </DialogTitle>
        <DialogContent>
          {/* Gives screen readers context without showing a subtitle. */}
          <DialogContentText id="help-dialog-description" sx={visuallyHidden}>
            Help resources and feedback options
          </DialogContentText>

          {showTabs && (
            <Tabs
              value={tab}
              onChange={(_e, value: HelpTab) => setTab(value)}
              variant="fullWidth"
              aria-label="Help sections"
              sx={{ mt: 1 }}
            >
              <Tab
                value="feedback"
                id="help-tab-feedback"
                aria-controls="help-panel-feedback"
                label="Feedback"
                icon={<Icon icon={Lightbulb} size={16} />}
                iconPosition="start"
              />
              <Tab
                value="shortcuts"
                id="help-tab-shortcuts"
                aria-controls="help-panel-shortcuts"
                label="Shortcuts"
                icon={<Icon icon={Keyboard} size={16} />}
                iconPosition="start"
              />
            </Tabs>
          )}

          <Box
            role={showTabs ? "tabpanel" : undefined}
            id={showTabs ? `help-panel-${panel}` : undefined}
            aria-labelledby={showTabs ? `help-tab-${panel}` : undefined}
            sx={{ mt: 2, height: 340, overflowY: "auto" }}
          >
            {panel === "shortcuts" ? (
              <ShortcutsPanel />
            ) : activeForm === null ? (
              <FeedbackOptions onPick={setActiveForm} />
            ) : (
              <ForumReportForm
                kind={activeForm}
                title={reports[activeForm].title}
                description={reports[activeForm].description}
                onTitleChange={updateReport(activeForm, "title")}
                onDescriptionChange={updateReport(activeForm, "description")}
                onBack={() => setActiveForm(null)}
                onSubmit={() => handleSubmit(activeForm)}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
