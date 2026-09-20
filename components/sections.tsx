import { BoxIcon, ChatIcon, FlagIcon, FolderIcon } from "@/components/icons";

/**
 * The section registry — one source of truth for the workspace's top-level
 * areas. Navigation, the dashboard grid and each section's header all read
 * from this list, so adding a section means adding one entry here rather
 * than editing four files.
 *
 * Each section owns exactly ONE identity color, reserved for that section:
 * never reuse them for generic buttons, links or text.
 */

export type SectionKey = "checkpoints" | "files" | "projects" | "chat";

export type SectionStatus = "live" | "shell";

export interface Section {
  key: SectionKey;
  href: string;
  label: string;
  tagline: string;
  blurb: string;
  /**
   * "live" — backed end to end, real data.
   * "shell" — routed and designed, with the data layer still to come.
   * The UI states this plainly rather than implying a section works.
   */
  status: SectionStatus;
  /** Identity color, reserved for this section alone. */
  accent: string;
  /** Tint used behind icons and chips for this section. */
  accentSoft: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  planned: string[];
}

export const SECTIONS: Section[] = [
  {
    key: "checkpoints",
    href: "/checkpoints",
    label: "Checkpoints",
    tagline: "Track team progress on one timeline.",
    blurb:
      "Post progress notes and milestone updates the whole team can follow.",
    status: "live",
    accent: "#149e61",
    accentSoft: "#e7f7ef",
    icon: (p) => <FlagIcon {...p} />,
    planned: [
      "Newest-first timeline, so recent progress is always on top",
      "Visible to the whole workspace, with authors and timestamps",
      "Authors edit and delete their own notes; admins can moderate any",
    ],
  },
  {
    key: "files",
    href: "/files",
    label: "Files",
    tagline: "Every team file, one browser.",
    blurb:
      "Browse, upload and organize shared team storage from inside the workspace.",
    status: "shell",
    accent: "#2563eb",
    accentSoft: "#e5edff",
    icon: (p) => <FolderIcon {...p} />,
    planned: [
      "Nested folders backed by the files table already in the schema",
      "Upload with progress, resumable for large files",
      "Move, rename, download and trash, with per-file permissions",
    ],
  },
  {
    key: "projects",
    href: "/projects",
    label: "Projects",
    tagline: "Ship work as packages, not threads.",
    blurb:
      "Publish described project bundles the rest of the team can preview and pull.",
    status: "shell",
    accent: "#c2410c",
    accentSoft: "#fdeee5",
    icon: (p) => <BoxIcon {...p} />,
    planned: [
      "Title, description and a preview image per project",
      "Interactive cards with a lightbox and one-click download",
      "Backed by the projects table, scoped per workspace member",
    ],
  },
  {
    key: "chat",
    href: "/chat",
    label: "Chat",
    tagline: "Talk where the work lives.",
    blurb: "Direct and group conversations with full, persistent history.",
    status: "shell",
    accent: "#7132f5",
    accentSoft: "#f0e9ff",
    icon: (p) => <ChatIcon {...p} />,
    planned: [
      "Direct and group conversations, access-controlled per participant",
      "Server-sent events for delivery, replacing any polling loop",
      "Unread watermarks per participant, already modeled in the schema",
    ],
  },
];

export const sectionByKey = (key: SectionKey): Section =>
  SECTIONS.find((s) => s.key === key) ?? SECTIONS[0];
