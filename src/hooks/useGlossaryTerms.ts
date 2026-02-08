import { useQuery } from "@tanstack/react-query";
import { queryKeys, unwrapOrThrow } from "@/services";
import { glossaryService } from "@/services/glossary/glossaryService";

export type { GlossaryTerm } from "@/services/glossary/glossaryService";

export function useGlossaryTerms() {
  return useQuery({
    queryKey: queryKeys.glossary.terms(),
    queryFn: async () => unwrapOrThrow(await glossaryService.getAll()),
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}
