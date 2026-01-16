export type UserProgressState =
  | 'ONBOARD_CONNECTORS'
  | 'ONBOARD_IMPORT'
  | 'ORGANISE_METADATA'
  | 'START_DEAL'
  | 'ENABLE_AUTOMATION'
  | 'MATURE_TODAY_FOCUS';

export type ProgressCta = {
  label: string;
  href: string;
};

export type MaestroQuickStart =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'maestro_intent'; label: string; intent: MaestroIntent };

export type MaestroIntent =
  | 'explain_connectors'
  | 'explain_import'
  | 'explain_metadata'
  | 'explain_deal_stages'
  | 'explain_playbooks'
  | 'next_best_actions';

export type UserProgressSignals = {
  hasConnectedAnyConnector: boolean;
  hasImportedAnyDocs: boolean;
  hasAnyDocsInVault: boolean;
  hasCompletedMetadataBasics: boolean;
  hasCreatedAnyDealOrWorkflow: boolean;
  hasRunAnyPlaybook: boolean;
  hasAnyTasks: boolean;
};

export type UserProgressNarration = {
  state: UserProgressState;
  title: string;
  description: string;
  primaryCta: ProgressCta;
  secondaryCta?: ProgressCta;
  quickStarts: MaestroQuickStart[];
};

function clampQuickStarts(items: MaestroQuickStart[]): MaestroQuickStart[] {
  // Keep deterministic ordering, enforce 3–5 (when possible).
  const unique: MaestroQuickStart[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const key =
      item.kind === 'link'
        ? `link:${item.href}:${item.label}`
        : `intent:${item.intent}:${item.label}`;

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  if (unique.length <= 5) return unique;
  return unique.slice(0, 5);
}

export function getUserProgressState(s: UserProgressSignals): UserProgressState {
  if (!s.hasConnectedAnyConnector) return 'ONBOARD_CONNECTORS';
  if (!s.hasImportedAnyDocs && !s.hasAnyDocsInVault) return 'ONBOARD_IMPORT';
  if (!s.hasCompletedMetadataBasics) return 'ORGANISE_METADATA';
  if (!s.hasCreatedAnyDealOrWorkflow) return 'START_DEAL';
  if (!s.hasRunAnyPlaybook) return 'ENABLE_AUTOMATION';
  return 'MATURE_TODAY_FOCUS';
}

export function getUserProgressNarration(s: UserProgressSignals): UserProgressNarration {
  const state = getUserProgressState(s);

  switch (state) {
    case 'ONBOARD_CONNECTORS': {
      const quickStarts = clampQuickStarts([
        { kind: 'link', label: 'Connect Google Drive', href: '/integrations' },
        { kind: 'link', label: 'Connect Gmail', href: '/integrations' },
        {
          kind: 'maestro_intent',
          label: 'What does a connector do?',
          intent: 'explain_connectors',
        },
        { kind: 'link', label: 'Show me my Vault', href: '/vault' },
      ]);
      return {
        state,
        title: 'Connect your tools',
        description: 'Connect Drive and Gmail so Harmonyk can find and organize your docs.',
        primaryCta: { label: 'Connect connectors', href: '/integrations' },
        secondaryCta: { label: 'Go to Vault', href: '/vault' },
        quickStarts,
      };
    }
    case 'ONBOARD_IMPORT': {
      const quickStarts = clampQuickStarts([
        { kind: 'link', label: 'Import from Drive', href: '/vault' },
        { kind: 'link', label: 'Create an NDA', href: '/builder/contracts' },
        { kind: 'link', label: 'Create a Deck', href: '/builder/decks' },
        { kind: 'maestro_intent', label: 'Why import?', intent: 'explain_import' },
      ]);
      return {
        state,
        title: 'Import your first docs',
        description: "Bring in a few docs so the Dashboard and Workbench aren't empty.",
        primaryCta: { label: 'Import documents', href: '/vault' },
        secondaryCta: { label: 'Open Builder', href: '/builder' },
        quickStarts,
      };
    }
    case 'ORGANISE_METADATA': {
      const quickStarts = clampQuickStarts([
        { kind: 'link', label: 'Tag 5 docs', href: '/vault' },
        { kind: 'link', label: 'Fix missing owners', href: '/vault' },
        { kind: 'link', label: 'Show stale docs', href: '/insights' },
        {
          kind: 'maestro_intent',
          label: 'What metadata matters?',
          intent: 'explain_metadata',
        },
      ]);
      return {
        state,
        title: 'Organize the basics',
        description: 'Add minimal metadata so search, filters, and insights become useful.',
        primaryCta: { label: 'Organize in Vault', href: '/vault' },
        secondaryCta: { label: 'View Insights', href: '/insights' },
        quickStarts,
      };
    }
    case 'START_DEAL': {
      const quickStarts = clampQuickStarts([
        { kind: 'link', label: 'Start a deal', href: '/workbench' },
        { kind: 'link', label: 'Share a doc', href: '/share' },
        { kind: 'link', label: 'Create a share link', href: '/share/links' },
        {
          kind: 'maestro_intent',
          label: 'How do stages work?',
          intent: 'explain_deal_stages',
        },
      ]);
      return {
        state,
        title: 'Start a workflow',
        description: 'Move one important doc or deal forward so outcomes start happening.',
        primaryCta: { label: 'Open Workbench', href: '/workbench' },
        secondaryCta: { label: 'Open Share Hub', href: '/share' },
        quickStarts,
      };
    }
    case 'ENABLE_AUTOMATION': {
      const quickStarts = clampQuickStarts([
        { kind: 'link', label: 'Run a playbook', href: '/playbooks' },
        {
          kind: 'maestro_intent',
          label: 'What can Playbooks automate?',
          intent: 'explain_playbooks',
        },
        { kind: 'link', label: 'Show automation wins', href: '/insights' },
      ]);
      return {
        state,
        title: 'Enable automation',
        description: 'Run one playbook to reduce repetitive work and track outcomes.',
        primaryCta: { label: 'Open Playbooks', href: '/playbooks' },
        secondaryCta: { label: 'View Insights', href: '/insights' },
        quickStarts,
      };
    }
    case 'MATURE_TODAY_FOCUS': {
      const quickStarts = clampQuickStarts([
        { kind: 'link', label: "Review today's tasks", href: '/tasks' },
        { kind: 'link', label: 'Chase signatures', href: '/signatures' },
        { kind: 'link', label: 'Open at-risk items', href: '/workbench' },
        {
          kind: 'maestro_intent',
          label: 'Ask Maestro: what should I do next?',
          intent: 'next_best_actions',
        },
      ]);
      return {
        state,
        title: 'Focus today',
        description: 'Pick the next best actions and let Maestro remind you until done.',
        primaryCta: { label: 'Open Tasks', href: '/tasks' },
        secondaryCta: { label: 'Open Workbench', href: '/workbench' },
        quickStarts,
      };
    }
  }
}

