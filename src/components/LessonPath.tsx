import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import { Zap } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import { LessonTopic } from "@/types/lessons";
import { LessonPathRow } from "./lessonPath/LessonPathRow";
import type { NodeState } from "./lessonPath/nodeState";

interface TopicProgress {
  topic_id: string;
  is_completed: boolean;
}

interface LessonPathProps {
  topics: LessonTopic[];
  topicProgress: TopicProgress[] | undefined;
  currentTopicIndex: number;
  onTopicClick: (slug: string) => void;
}


export function LessonPath({
  topics,
  topicProgress,
  currentTopicIndex,
  onTopicClick,
}: LessonPathProps) {
  const isCompleted = (topicId: string) =>
    topicProgress?.some((p) => p.topic_id === topicId && p.is_completed) ?? false;

  return (
    <Box sx={{ position: "relative" }}>
      {topics.map((lessonTopic, index) => {
        const topic = lessonTopic.topic;
        if (!topic) return null;

        const completed = isCompleted(topic.id);
        const isCurrent = index === currentTopicIndex;
        const isLocked = !completed && index > currentTopicIndex;
        const isLast = index === topics.length - 1;
        const state: NodeState = completed
          ? "completed"
          : isCurrent
            ? "current"
            : isLocked
              ? "locked"
              : "upcoming";

        return (
          <MotionBox
            key={lessonTopic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            sx={{ position: "relative" }}
          >
            {/* Connecting track behind the nodes */}
            {!isLast && (
              <Box sx={{ position: "absolute", left: 22, top: 48, width: 4, height: "100%", zIndex: 0 }}>
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "9999px",
                    bgcolor: (t) => tokenAlpha(t.vars.palette.divider, 50),
                  }}
                />
                <MotionBox
                  initial={{ height: 0 }}
                  animate={{ height: completed ? "100%" : "0%" }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    borderRadius: "9999px",
                    bgcolor: completed
                      ? "success.main"
                      : (t) => tokenAlpha(t.vars.palette.divider, 30),
                  }}
                />
              </Box>
            )}

            <LessonPathRow
              topic={topic}
              index={index}
              state={state}
              onClick={() => onTopicClick(topic.slug)}
            />

            {!isLast && <Box sx={{ height: 8 }} />}
          </MotionBox>
        );
      })}

      {topics.length === 0 && (
        <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ textAlign: "center", py: 8 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
              borderRadius: "50%",
              bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 50),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon icon={Zap} size={32} sx={{ color: "text.secondary" }} />
          </Box>
          <Box sx={{ color: "text.secondary", fontWeight: 500 }}>
            No topics have been added to this lesson yet.
          </Box>
        </MotionBox>
      )}
    </Box>
  );
}
