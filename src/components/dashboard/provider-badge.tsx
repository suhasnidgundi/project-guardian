import { Badge } from "@/components/ui/badge";
import type { RepoProvider } from "@/lib/types";

const PROVIDER_CONFIG: Record<
  RepoProvider,
  { label: string; className: string }
> = {
  github: {
    label: "GitHub",
    className: "border-[#333]/20 bg-[#333]/10 text-[#333] dark:border-[#f0f0f0]/20 dark:bg-[#f0f0f0]/10 dark:text-[#f0f0f0]",
  },
  gitlab: {
    label: "GitLab",
    className: "border-orange-600/20 bg-orange-600/10 text-orange-700 dark:text-orange-400",
  },
  bitbucket: {
    label: "Bitbucket",
    className: "border-blue-600/20 bg-blue-600/10 text-blue-700 dark:text-blue-400",
  },
  azure: {
    label: "Azure DevOps",
    className: "border-sky-600/20 bg-sky-600/10 text-sky-700 dark:text-sky-400",
  },
  codecommit: {
    label: "CodeCommit",
    className: "border-yellow-600/20 bg-yellow-600/10 text-yellow-700 dark:text-yellow-400",
  },
  "self-hosted": {
    label: "Self-hosted",
    className: "border-violet-600/20 bg-violet-600/10 text-violet-700 dark:text-violet-400",
  },
  none: {
    label: "No Remote",
    className: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
};

interface ProviderBadgeProps {
  provider: RepoProvider;
}

export function ProviderBadge({ provider }: ProviderBadgeProps) {
  const { label, className } = PROVIDER_CONFIG[provider];
  return (
    <Badge variant="outline" className={`text-xs font-normal ${className}`}>
      {label}
    </Badge>
  );
}
