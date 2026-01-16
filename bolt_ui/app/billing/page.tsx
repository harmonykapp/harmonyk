import { AppShell } from '@/components/shell/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Download,
  Check,
  AlertCircle,
  Zap,
  Users,
} from 'lucide-react';

const invoices = [
  {
    id: 'INV-2024-11',
    date: 'Nov 1, 2024',
    amount: '$60.00',
    status: 'paid',
    period: 'Nov 1 - Nov 30, 2024',
  },
  {
    id: 'INV-2024-10',
    date: 'Oct 1, 2024',
    amount: '$60.00',
    status: 'paid',
    period: 'Oct 1 - Oct 31, 2024',
  },
  {
    id: 'INV-2024-09',
    date: 'Sep 1, 2024',
    amount: '$60.00',
    status: 'paid',
    period: 'Sep 1 - Sep 30, 2024',
  },
  {
    id: 'INV-2024-08',
    date: 'Aug 1, 2024',
    amount: '$60.00',
    status: 'paid',
    period: 'Aug 1 - Aug 31, 2024',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For individuals getting started',
    features: [
      '2 connected sources',
      '10 active share links',
      '30 AI analyses per month',
      'Basic search',
      'Harmonyk branding',
    ],
    current: false,
  },
  {
    name: 'Starter',
    price: '$30',
    period: 'per seat/month',
    description: 'For small teams and professionals',
    features: [
      '5 connected sources',
      'Unlimited share links',
      '100 AI analyses per month',
      'Federated search',
      'Custom branding',
      '1 custom Playbook',
    ],
    current: false,
  },
  {
    name: 'Pro',
    price: '$60',
    period: 'per seat/month',
    description: 'For growing teams and power users',
    features: [
      '10 connected sources',
      'Unlimited AI analyses',
      'Semantic & full-text search',
      'Unlimited Playbooks',
      'Two-way calendar sync',
      'Advanced analytics',
      'Priority support',
    ],
    current: true,
  },
  {
    name: 'Teams',
    price: '$200',
    period: 'for 3 seats/month',
    description: 'For larger organizations',
    features: [
      '20 pooled sources',
      'Org-wide Playbooks',
      'Custom retention rules',
      'Team governance',
      'SLA guarantees',
      'Dedicated support',
      'Advanced security',
    ],
    current: false,
  },
];

export default function BillingPage() {
  return (
    <AppShell monoContext="dashboard">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and billing information
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>You are on the Pro plan</CardDescription>
                </div>
                <Badge className="bg-primary text-primary-foreground">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-accent/50 rounded-lg">
                <div>
                  <h3 className="text-2xl font-bold">Pro Plan</h3>
                  <p className="text-muted-foreground mt-1">
                    $60.00 per seat/month • Billed monthly
                  </p>
                </div>
                <Button variant="outline">Change Plan</Button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Usage this month</span>
                    <span className="text-sm text-muted-foreground">67 / 100 seats</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: '67%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">AI Analyses</span>
                    <span className="text-sm text-muted-foreground">
                      347 / Unlimited
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Connected Sources</span>
                    <span className="text-sm text-muted-foreground">6 / 10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: '60%' }} />
                  </div>
                </div>
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
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative p-6 border-2 rounded-lg ${
                    plan.current
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  {plan.current && (
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                      Current Plan
                    </Badge>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm ml-1">
                        /{plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {plan.description}
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
                    variant={plan.current ? 'outline' : 'default'}
                    disabled={plan.current}
                  >
                    {plan.current ? 'Current Plan' : 'Upgrade'}
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
              {invoices.map((invoice) => (
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
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
