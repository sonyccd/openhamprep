import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { PageContainer } from "@/components/ohp/PageContainer";

/** The page's shape while the topic loads: header, three columns of content. */
export function TopicDetailSkeleton() {
  return (
    <PageContainer width="full">
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="rounded" width={192} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" width="75%" height={40} sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Skeleton variant="rounded" width={64} height={24} />
          <Skeleton variant="rounded" width={64} height={24} />
        </Box>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "200px 1fr 250px" },
          gap: 4,
        }}
      >
        <Box sx={{ display: { xs: "none", lg: "block" } }}>
          <Skeleton variant="rounded" width="100%" height={192} />
        </Box>
        <Box>
          <Skeleton variant="rounded" width="100%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" width="100%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="75%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="83%" height={16} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" width="66%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" width="100%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="80%" height={16} />
        </Box>
        <Box sx={{ display: { xs: "none", lg: "block" } }}>
          <Skeleton variant="rounded" width="100%" height={256} />
        </Box>
      </Box>
    </PageContainer>
  );
}
