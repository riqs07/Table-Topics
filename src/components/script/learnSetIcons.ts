// Each Learn set's icon, for its course card (decision 57)

// Load the icons
import { BarbellIcon, GraduationCapIcon, BookOpenTextIcon, BriefcaseIcon, ChartLineUpIcon, ChatsCircleIcon, HandHeartIcon, HandshakeIcon, HandWavingIcon, HeartbeatIcon, ScalesIcon, SmileyIcon, SparkleIcon, TargetIcon, TextAaIcon, WaveformIcon } from "@phosphor-icons/react/dist/ssr";
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
  // Your voice
  voice: WaveformIcon,
  // Getting your point across
  point: TargetIcon,
  // Changing minds
  minds: ScalesIcon,
  // Hard conversations
  hard: HandshakeIcon,
  // Word choice (decision 94)
  words: TextAaIcon,
  // Reading your profile
  profile: ChartLineUpIcon,
  // Humour
  humour: SmileyIcon,
  // Speaking at work
  work: BriefcaseIcon,
  // Speaking skills: the lessons (decision 107)
  skills: GraduationCapIcon,
};
