import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HelpCircle } from "lucide-react";

interface QuestionLinkingHeaderProps {
  title: string;
  description: string;
}

/** The heading over a question-linking panel. */
export function QuestionLinkingHeader({ title, description }: QuestionLinkingHeaderProps) {
  return (
    <Box>
      <Typography component="h3" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "1.125rem", fontWeight: 600 }}>
        <Icon icon={HelpCircle} size={20} />
        {title}
      </Typography>
      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 0.5 }}>{description}</Typography>
    </Box>
  );
}
