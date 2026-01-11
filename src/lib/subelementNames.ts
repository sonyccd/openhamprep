/**
 * Subelement names by test type
 * Source: NCVEC Question Pool Committee syllabi
 */
export const SUBELEMENT_NAMES: Record<string, Record<string, string>> = {
  technician: {
    T0: "Safety",
    T1: "Commission's Rules",
    T2: "Operating Procedures",
    T3: "Radio Wave Characteristics",
    T4: "Amateur Radio Practices",
    T5: "Electrical Principles",
    T6: "Electronic Components",
    T7: "Station Equipment",
    T8: "Operating Activities",
    T9: "Antennas & Feed Lines"
  },
  general: {
    G0: "Safety",
    G1: "Commission's Rules",
    G2: "Operating Procedures",
    G3: "Radio Wave Propagation",
    G4: "Amateur Radio Practices",
    G5: "Electrical Principles",
    G6: "Circuit Components",
    G7: "Practical Circuits",
    G8: "Signals and Emissions",
    G9: "Antennas & Feed Lines"
  },
  extra: {
    E0: "Safety",
    E1: "Commission's Rules",
    E2: "Operating Procedures",
    E3: "Radio Wave Propagation",
    E4: "Amateur Practices",
    E5: "Electrical Principles",
    E6: "Circuit Components",
    E7: "Practical Circuits",
    E8: "Signals and Emissions",
    E9: "Antennas & Transmission Lines"
  }
};

/**
 * Get subelement name with fallback
 */
export function getSubelementName(testType: string, code: string): string {
  return SUBELEMENT_NAMES[testType]?.[code] || `Subelement ${code}`;
}
