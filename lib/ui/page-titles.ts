export function getPageTitle(pathname: string | null | undefined): string {
  const path = pathname ?? '/dashboard';

  // Builder subroutes (most specific first)
  if (path === '/builder/contracts' || path.startsWith('/builder/contracts/')) return 'Contract Builder';
  if (path === '/builder/decks' || path.startsWith('/builder/decks/')) return 'Deck Builder';
  if (path === '/builder/whitepapers' || path.startsWith('/builder/whitepapers/')) return 'Whitepaper Builder';
  if (path === '/builder/accounts' || path.startsWith('/builder/accounts/')) return 'Account Builder';

  // Primary nav routes
  if (path === '/dashboard' || path.startsWith('/dashboard/')) return 'Dashboard';
  if (path === '/workbench' || path.startsWith('/workbench/')) return 'Workbench';
  if (path === '/builder' || path === '/builder/draft' || path.startsWith('/builder/')) return 'Builder';
  if (path === '/vault' || path.startsWith('/vault/')) return 'Vault';
  if (path === '/share' || path.startsWith('/share/')) return 'Share Hub';
  if (path === '/insights' || path.startsWith('/insights/')) return 'Insights';
  if (path === '/playbooks' || path.startsWith('/playbooks/')) return 'Playbooks';
  if (path === '/tasks' || path.startsWith('/tasks/')) return 'Tasks';
  if (path === '/calendar' || path.startsWith('/calendar/')) return 'Tasks';
  if (path === '/integrations' || path.startsWith('/integrations/')) return 'Integrations';
  if (path === '/settings' || path.startsWith('/settings/')) return 'Settings';

  return 'Harmonyk';
}
