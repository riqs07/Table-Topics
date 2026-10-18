// Each Connect unit's icon, for its card and page (decision 57)

// Load the icons
import { ChatTeardropTextIcon, EarIcon, MegaphoneSimpleIcon, QuestionIcon } from "@phosphor-icons/react/dist/ssr";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the unit id type
import type { UnitId } from "@/content/smallTalk";

// The icons, by unit
export const UNIT_ICONS: Readonly<Record<UnitId, Icon>> = {
  // Answering
  answering: ChatTeardropTextIcon,
  // Asking
  asking: QuestionIcon,
  // Listening
  listening: EarIcon,
  // Responding to news
  news: MegaphoneSimpleIcon,
};
