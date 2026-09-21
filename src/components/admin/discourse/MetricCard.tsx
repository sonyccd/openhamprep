import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

interface MetricCardProps {
  title: string;
  children: React.ReactNode;
}

/** One figure with a small heading over it. */
export function MetricCard({ title, children }: MetricCardProps) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography component="h3" sx={{ fontSize: "0.875rem", fontWeight: 500, color: "text.secondary" }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}
