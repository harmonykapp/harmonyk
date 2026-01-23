import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CreditCard, Download, Plug, Shield, Sparkles, User, Users } from "lucide-react";

type BillingPlanId = "free" | "starter" | "pro" | "teams";

type BillingPlanLimits = {
  connectedSources: string;
  shareLinks: string;
  aiAnalysesPerMonth: string;
  playbooks: string;
};

type BillingPlan = {
  id: BillingPlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  billingLabel: string;
  limits: BillingPlanLimits;
  features: string[];
  current: boolean;
};

const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For individuals getting started",
    billingLabel: "$0 • forever",
    limits: {
      connectedSources: "2 connected sources",
      shareLinks: "10 active share links",
      aiAnalysesPerMonth: "30 AI analyses per month",
      playbooks: "No custom Playbooks",
    },
    features: [
      "2 connected sources",
      "10 active share links",
      "30 AI analyses per month",
      "Basic search",
      "Harmonyk branding",
    ],
    current: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$30",
    period: "per seat/month",
    description: "For small teams and professionals",
    billingLabel: "$30 per seat/month • billed monthly",
    limits: {
      connectedSources: "5 connected sources",
      shareLinks: "Unlimited share links",
      aiAnalysesPerMonth: "100 AI analyses per month",
      playbooks: "1 custom Playbook",
    },
    features: [
      "5 connected sources",
      "Unlimited share links",
      "100 AI analyses per month",
      "Federated search",
      "Custom branding",
      "1 custom Playbook",
    ],
    current: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$60",
    period: "per seat/month",
    description: "For growing teams and power users",
    billingLabel: "$60 per seat/month • billed monthly",
    limits: {
      connectedSources: "10 connected sources",
      shareLinks: "Unlimited share links",
      aiAnalysesPerMonth: "Unlimited AI analyses",
      playbooks: "Unlimited Playbooks",
    },
    features: [
      "10 connected sources",
      "Unlimited AI analyses",
      "Semantic & full-text search",
      "Unlimited Playbooks",
      "Two-way calendar sync",
      "Advanced analytics",
      "Priority support",
    ],
    current: true,
  },
  {
    id: "teams",
    name: "Teams",
    price: "$200",
    period: "for 3 seats/month",
    description: "For larger organizations",
    billingLabel: "$200 for 3 seats/month • billed monthly",
    limits: {
      connectedSources: "20 pooled sources",
      shareLinks: "Unlimited share links",
      aiAnalysesPerMonth: "Unlimited AI analyses",
      playbooks: "Org-wide Playbooks",
    },
    features: [
      "20 pooled sources",
      "Org-wide Playbooks",
      "Custom retention rules",
      "Team governance",
      "SLA guarantees",
      "Dedicated support",
      "Advanced security",
    ],
    current: false,
  },
];

export default function SettingsPage() {
  const currentPlan = BILLING_PLANS.find((plan) => plan.current) ?? BILLING_PLANS[0];
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    U
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline">Change Avatar</Button>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="First name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Last name" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Company name" />
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Document Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when documents are edited or updated
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Signature Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for new signature requests
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Playbook Completions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when automated workflows complete
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maestro Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive AI-generated insights and recommendations
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Get a weekly digest of your document activity
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>

              <Button>Update Password</Button>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                      You are on the {currentPlan.name} plan
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-accent/50 rounded-lg">
                  <div>
                    <h3 className="text-base font-semibold">
                      {currentPlan.name} Plan
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {currentPlan.billingLabel}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Limits: {currentPlan.limits.connectedSources} ·{" "}
                      {currentPlan.limits.shareLinks} ·{" "}
                      {currentPlan.limits.aiAnalysesPerMonth} ·{" "}
                      {currentPlan.limits.playbooks}
                    </p>
                  </div>
                  <Button variant="outline">Change Plan</Button>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Next billing date</p>
                      <p className="text-sm text-muted-foreground">December 1, 2024</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">$60.00</p>
                      <p className="text-sm text-muted-foreground">1 seat</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Your saved payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Default
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">
                  Update Payment Method
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>
                Choose the plan that works best for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-4">
                {BILLING_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 border-2 rounded-lg ${plan.current
                      ? "border-primary bg-primary/5"
                      : "border-border"
                      }`}
                  >
                    {plan.current && (
                      <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                        Current Plan
                      </Badge>
                    )}
                    <div className="mb-4">
                      <h3 className="text-base font-semibold">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground text-sm ml-1">
                          /{plan.period}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {plan.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Limits: {plan.limits.connectedSources} ·{" "}
                        {plan.limits.shareLinks} ·{" "}
                        {plan.limits.aiAnalysesPerMonth}
                        {plan.limits.playbooks
                          ? ` · ${plan.limits.playbooks}`
                          : null}
                      </p>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.current ? "outline" : "default"}
                      disabled={plan.current}
                    >
                      {plan.current ? "Current Plan" : "Upgrade"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: "INV-2024-11",
                    date: "Nov 1, 2024",
                    amount: "$60.00",
                    status: "paid",
                    period: "Nov 1 - Nov 30, 2024",
                  },
                  {
                    id: "INV-2024-10",
                    date: "Oct 1, 2024",
                    amount: "$60.00",
                    status: "paid",
                    period: "Oct 1 - Oct 31, 2024",
                  },
                  {
                    id: "INV-2024-09",
                    date: "Sep 1, 2024",
                    amount: "$60.00",
                    status: "paid",
                    period: "Sep 1 - Sep 30, 2024",
                  },
                ].map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{invoice.id}</h4>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{invoice.date}</span>
                        <span>•</span>
                        <span>{invoice.period}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{invoice.amount}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={`Download invoice ${invoice.id}`}
                        aria-label={`Download invoice ${invoice.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">Invite Team Member</Button>

              <Separator />

              <div className="space-y-3">
                {[
                  { name: "User 1", email: "user1@example.com", role: "Owner" },
                  { name: "User 2", email: "user2@example.com", role: "Admin" },
                  { name: "User 3", email: "user3@example.com", role: "Member" },
                ].map((member, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{member.role}</span>
                      {member.role !== "Owner" && (
                        <Button variant="ghost" size="sm">
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Integrations</CardTitle>
              <CardDescription>
                Manage your connected apps and services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Google Drive", status: "Connected", accounts: 2 },
                { name: "Gmail", status: "Connected", accounts: 1 },
                { name: "Slack", status: "Connected", accounts: 1 },
                { name: "Microsoft 365", status: "Not Connected", accounts: 0 },
                { name: "Dropbox", status: "Not Connected", accounts: 0 },
              ].map((integration, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="text-sm font-semibold">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {integration.status === "Connected"
                        ? `${integration.accounts} account(s) connected`
                        : "Not connected"}
                    </p>
                  </div>
                  <Button
                    variant={integration.status === "Connected" ? "outline" : "default"}
                  >
                    {integration.status === "Connected" ? "Manage" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

