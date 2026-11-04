// The page shell shared by every page with the main navigation (decision 65)

// One width for the navigation and masthead on every page, so the tabs never jump; on a computer the content under them keeps a readable width, so rows and their chevrons stay together
export const PAGE = "mx-auto min-h-dvh max-w-6xl bg-paper-raised px-5 pt-6 pb-16 md:px-12 md:pt-10 md:[&>:not(header,nav,[data-action-band],[data-wide])]:max-w-3xl";
