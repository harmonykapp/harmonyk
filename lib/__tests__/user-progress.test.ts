import { describe, expect, it } from 'vitest';
import { getUserProgressNarration, getUserProgressState } from '@/lib/user-progress';

describe('user-progress', () => {
  it('returns ONBOARD_CONNECTORS when no connector is connected', () => {
    const state = getUserProgressState({
      hasConnectedAnyConnector: false,
      hasImportedAnyDocs: false,
      hasAnyDocsInVault: false,
      hasCompletedMetadataBasics: false,
      hasCreatedAnyDealOrWorkflow: false,
      hasRunAnyPlaybook: false,
      hasAnyTasks: false,
    });
    expect(state).toBe('ONBOARD_CONNECTORS');
  });

  it('returns ONBOARD_IMPORT when connector is connected but no docs exist', () => {
    const state = getUserProgressState({
      hasConnectedAnyConnector: true,
      hasImportedAnyDocs: false,
      hasAnyDocsInVault: false,
      hasCompletedMetadataBasics: false,
      hasCreatedAnyDealOrWorkflow: false,
      hasRunAnyPlaybook: false,
      hasAnyTasks: false,
    });
    expect(state).toBe('ONBOARD_IMPORT');
  });

  it('returns ORGANISE_METADATA when docs exist but metadata basics are not complete', () => {
    const state = getUserProgressState({
      hasConnectedAnyConnector: true,
      hasImportedAnyDocs: true,
      hasAnyDocsInVault: true,
      hasCompletedMetadataBasics: false,
      hasCreatedAnyDealOrWorkflow: false,
      hasRunAnyPlaybook: false,
      hasAnyTasks: false,
    });
    expect(state).toBe('ORGANISE_METADATA');
  });

  it('narration includes a primary CTA and up to 5 quick-starts', () => {
    const narration = getUserProgressNarration({
      hasConnectedAnyConnector: false,
      hasImportedAnyDocs: false,
      hasAnyDocsInVault: false,
      hasCompletedMetadataBasics: false,
      hasCreatedAnyDealOrWorkflow: false,
      hasRunAnyPlaybook: false,
      hasAnyTasks: false,
    });
    expect(narration.primaryCta.label.length).toBeGreaterThan(0);
    expect(narration.primaryCta.href.length).toBeGreaterThan(0);
    expect(narration.quickStarts.length).toBeGreaterThan(0);
    expect(narration.quickStarts.length).toBeLessThanOrEqual(5);
  });
});
