import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Box
      sx={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", bgcolor: "muted" }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Typography component="h1" sx={{ mb: 2, fontSize: "2.25rem", fontWeight: 700 }}>
          404
        </Typography>
        <Typography sx={{ mb: 2, fontSize: "1.25rem", color: "text.secondary" }}>
          Oops! Page not found
        </Typography>
        <Link href="/" underline="always">
          Return to Home
        </Link>
      </Box>
    </Box>
  );
};

export default NotFound;
