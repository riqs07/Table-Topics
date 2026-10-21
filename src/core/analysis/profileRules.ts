// How many takes the speaking profile needs before it compares, trends, flags or finds patterns (decision 90). Kept apart from the profile's code so the Learn card that explains them reads the same numbers (decision 94)

// The take counts the profile works with
export const PROFILE_RULES = {
  // Takes for the usual level: the first few in a family
  usualTakes: 5,
  // Takes for the recent level: the latest few in a family
  recentTakes: 7,
  // Fewest takes before a trend is given
  minForTrend: 6,
  // Fewest takes before a change flag is looked for
  minForFlag: 8,
  // Takes in a row that make a change
  flagRun: 3,
  // Fewest takes in a family before patterns are looked for
  minForPatterns: 15,
} as const;
