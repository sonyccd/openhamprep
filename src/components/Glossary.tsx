import { useState, useMemo, useEffect, useRef } from "react";
import { Search, BookText } from "lucide-react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/ohp/PageContainer";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import { trackGlossarySearched } from "@/lib/amplitude";

export function Glossary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedTermId, setHighlightedTermId] = useState<string | null>(null);
  const termRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { selectedGlossaryTermId, setSelectedGlossaryTermId } = useAppNavigation();

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ['glossary-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .order('term', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return terms;
    const query = searchQuery.toLowerCase();
    return terms.filter(term => 
      term.term.toLowerCase().includes(query) || 
      term.definition.toLowerCase().includes(query)
    );
  }, [terms, searchQuery]);

  // Group terms by first letter
  const groupedTerms = useMemo(() => {
    const groups: Record<string, typeof terms> = {};
    filteredTerms.forEach(term => {
      const firstChar = term.term[0].toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(term);
    });
    return groups;
  }, [filteredTerms]);

  const sortedKeys = Object.keys(groupedTerms).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  // Track glossary searches in Amplitude (debounced 1s, min 3 chars)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) return;
    const timer = setTimeout(() => {
      trackGlossarySearched(trimmed);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle scroll-to-term when navigated from search
  useEffect(() => {
    if (selectedGlossaryTermId && !isLoading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const termElement = termRefs.current.get(selectedGlossaryTermId);
        if (termElement) {
          termElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedTermId(selectedGlossaryTermId);
          // Clear highlight after animation
          setTimeout(() => {
            setHighlightedTermId(null);
          }, 2000);
        }
        // Clear the navigation state
        setSelectedGlossaryTermId(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedGlossaryTermId, isLoading, setSelectedGlossaryTermId]);

  if (isLoading) {
    return (
      <PageContainer width="wide" className="flex items-center justify-center">
        <CircularProgress size={32} role="status" aria-label="Loading glossary" />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide" className="flex flex-col h-full">
      {/* Header */}
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 2 }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Box component={BookText} aria-hidden="true" sx={{ width: 24, height: 24, color: "primary.main" }} />
          Glossary
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
          {terms.length} terms • Search or browse ham radio terminology
        </Typography>
      </MotionBox>

      {/* Search */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        sx={{ mb: 3 }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search terms or definitions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Box component={Search} aria-hidden="true" sx={{ width: 16, height: 16, color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </MotionBox>

      {/* Terms List */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        sx={{ flex: 1, mx: -1, px: 1, minHeight: 0 }}
      >
        {/* Radix ScrollArea replaced by a plain scroll container; it was only
            providing overflow, not custom scrollbar behaviour this app relied on. */}
        <Box sx={{ height: "100%", overflowY: "auto" }}>
          {filteredTerms.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
              No terms found matching "{searchQuery}"
            </Box>
          ) : (
            <Stack spacing={3} sx={{ pb: 4 }}>
              {sortedKeys.map((letter) => (
                <Box key={letter}>
                  <Box
                    sx={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      py: 1,
                      bgcolor: (theme) => tokenAlpha(theme.vars.palette.background.default, 95),
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <Typography component="span" sx={{ fontSize: "1.125rem", fontWeight: 700, color: "primary.main" }}>
                      {letter}
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    {groupedTerms[letter].map((term) => (
                      <Card
                        key={term.id}
                        // variant="outlined" is what makes the borderColor
                        // below mean anything. Material's default variant is
                        // "elevation", which declares a box-shadow and no
                        // border at all (Paper.js), so border-color alone had
                        // nothing to colour — the resting border and the hover
                        // accent both silently did nothing. The shadcn Card
                        // this replaced always carried Tailwind's `border`.
                        variant="outlined"
                        ref={(el: HTMLDivElement | null) => {
                          if (el) {
                            termRefs.current.set(term.id, el);
                          } else {
                            termRefs.current.delete(term.id);
                          }
                        }}
                        sx={{
                          bgcolor: (theme) => tokenAlpha(theme.vars.palette.background.paper, 50),
                          borderColor: (theme) => tokenAlpha(theme.vars.palette.divider, 50),
                          transition: "all 200ms",
                          "&:hover": {
                            borderColor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 30),
                          },
                          ...(highlightedTermId === term.id && {
                            outline: "2px solid",
                            outlineColor: "primary.main",
                            outlineOffset: 2,
                            bgcolor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 5),
                          }),
                        }}
                      >
                        {/*
                          A real link, not a div with role="button". This opens a
                          DuckDuckGo search in a new tab, which is navigation —
                          so an anchor gets native Enter activation without a
                          handler, plus middle-click, ctrl-click and the browser's
                          own "open in new tab". The previous version was the
                          third copy of the div-as-button pattern in this app;
                          the copy in HamRadioToolCard never fired at all (#272).
                        */}
                        <Box
                          component="a"
                          href={`https://duckduckgo.com/?q=${encodeURIComponent(term.term)}&kp=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Search "${term.term}" on DuckDuckGo`}
                          sx={{
                            display: "block",
                            textDecoration: "none",
                            color: "inherit",
                            borderRadius: 2,
                            "&:focus": { outline: "none" },
                            "&:focus-visible": {
                              outline: "2px solid",
                              outlineColor: "primary.main",
                              outlineOffset: 2,
                            },
                          }}
                        >
                          <CardContent sx={{ py: 1.5, px: 2 }}>
                            <Typography component="h3" sx={{ fontWeight: 600, fontSize: "1.125rem" }}>
                              {term.term}
                            </Typography>
                            <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
                              {term.definition}
                            </Typography>
                          </CardContent>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </MotionBox>
    </PageContainer>
  );
}
