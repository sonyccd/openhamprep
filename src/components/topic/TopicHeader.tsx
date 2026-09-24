import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { ArrowLeft } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { TopicProgressButton } from "@/components/TopicProgressButton";
import type { Topic } from "@/hooks/useTopics";

interface TopicHeaderProps {
  topic: Topic;
  questionCount: number;
  backLabel: string;
  onBack: () => void;
}

/** The band across the top: the way back, the title, its subelements, and where the reader stands. */
export function TopicHeader({ topic, questionCount, backLabel, onBack }: TopicHeaderProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
    >
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
        <Button
          variant="text"
          size="small"
          onClick={onBack}
          startIcon={<Icon icon={ArrowLeft} size={16} />}
          sx={{ mb: 2, ml: -1, color: "text.secondary", "&:hover": { color: "text.primary" } }}
        >
          {backLabel}
        </Button>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { md: "flex-start" },
            justifyContent: { md: "space-between" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontSize: { xs: "1.5rem", md: "1.875rem" }, fontWeight: 700, mb: 1 }}
            >
              {topic.title}
            </Typography>
            {topic.description && (
              <Typography sx={{ color: "text.secondary", maxWidth: 672 }}>
                {topic.description}
              </Typography>
            )}
            {topic.subelements && topic.subelements.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                {topic.subelements.map((sub) => (
                  <Chip key={sub.id} color="secondary" size="small" label={sub.subelement} />
                ))}
              </Box>
            )}
          </Box>

          <TopicProgressButton topicId={topic.id} questionCount={questionCount} sx={{ flexShrink: 0 }} />
        </Box>
      </Box>
    </MotionBox>
  );
}
