// Each Learn set's icon, for its course card (decision 57)

// Load the icons
import { BarbellIcon, BookOpenTextIcon, ChatsCircleIcon, HandHeartIcon, HandWavingIcon, HeartbeatIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
// Load the icon type
import type { Icon } from "@phosphor-icons/react";
// Load the set id type
import type { LearnSetId } from "@/content/learn";

// The icons, by set
export const LEARN_SET_ICONS: Readonly<Record<LearnSetId, Icon>> = {
  // Nerves and presence
  nerves: HeartbeatIcon,
  // Charisma
  charisma: SparkleIcon,
  // Body language
  body: HandWavingIcon,
  // Conversation
  conversation: ChatsCircleIcon,
  // Warmth and connection
  warmth: HandHeartIcon,
  // Stories
  stories: BookOpenTextIcon,
  // How to practise
  practice: BarbellIcon,
};
