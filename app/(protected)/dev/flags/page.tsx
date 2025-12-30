import { listFeatureFlags, isFeatureEnabledForEnv } from "@/lib/flags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default function DevFlagsPage() {
  const flags = listFeatureFlags();
  const visualAssistantEnabled = isFeatureEnabledForEnv("FEATURE_VISUAL_ASSISTANT");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Feature Flags (Dev Only)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal view of Harmonyk feature flags and their effective values. This route is for
          PGW1 diagnostics and should not be exposed to end users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registry</CardTitle>
          <CardDescription>
            Flags defined in <code className="font-mono text-xs">lib/flags.ts</code> with env overrides
            applied.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 text-left font-medium">Flag</th>
                  <th className="py-2 px-4 text-left font-medium">Scope</th>
                  <th className="py-2 px-4 text-left font-medium">Owner</th>
                  <th className="py-2 px-4 text-left font-medium">Effective</th>
                  <th className="py-2 px-4 text-left font-medium">Env Override</th>
                  <th className="py-2 pl-4 text-left font-medium">Tags</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag) => (
                  <tr key={flag.key} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 align-top">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{flag.key}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {flag.description}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 align-top">
                      <Badge variant="outline" className="text-xs">
                        {flag.scope}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 align-top">
                      <span className="text-xs text-muted-foreground">{flag.owner}</span>
                    </td>
                    <td className="py-2 px-4 align-top">
                      {flag.effectiveValue ? (
                        <Badge className="text-xs">enabled</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          disabled
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 px-4 align-top">
                      {typeof flag.envOverride === "boolean" ? (
                        <span className="text-xs">
                          {flag.envOverride ? "true" : "false"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">none</span>
                      )}
                    </td>
                    <td className="py-2 pl-4 align-top">
                      <div className="flex flex-wrap gap-1">
                        {flag.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visual Assistant Flag Stub</CardTitle>
          <CardDescription>
            Minimal UI element gated behind{" "}
            <code className="font-mono text-xs">FEATURE_VISUAL_ASSISTANT</code> for PGW1.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visualAssistantEnabled ? (
            <div className="rounded-lg border bg-muted/60 p-4">
              <p className="text-sm font-medium">
                Visual Assistant is <span className="text-emerald-600">enabled</span> for this env.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                In PGW2+ this will map to a real &ldquo;Suggest visual&rdquo; button in Deck Builder.
                For now it simply proves flag wiring works end-to-end.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Visual Assistant is currently disabled. Set{" "}
              <code className="font-mono text-xs">NEXT_PUBLIC_FEATURE_VISUAL_ASSISTANT=true</code>{" "}
              to see the stub UI.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

