// data/clauses.ts

export type Clause = {
  id: string;
  name: string;
  description: string;
  tags: (
    | "general"
    | "ip"
    | "privacy"
    | "payments"
    | "liability"
    | "hr"
    | "boilerplate"
    | "compliance"
    | "disputes"
  )[];
};

export const CLAUSES: Clause[] = [
  // Core commercial
  {
    id: "payment-terms",
    name: "Payment Terms",
    description:
      "When, how, and in what currency payments are due; late fees, set-off, and invoicing rules.",
    tags: ["payments", "general"],
  },
  {
    id: "price-and-taxes",
    name: "Price and Taxes",
    description: "Pricing basis, inclusions/exclusions, sales/VAT/GST handling, and changes.",
    tags: ["payments", "general"],
  },
  {
    id: "service-scope",
    name: "Service Scope",
    description: "What is in/out of scope, change control, and dependencies.",
    tags: ["general"],
  },
  {
    id: "acceptance",
    name: "Acceptance",
    description: "Testing criteria, acceptance windows, and deemed acceptance.",
    tags: ["general"],
  },

  // Confidentiality / IP
  {
    id: "confidentiality",
    name: "Confidentiality",
    description:
      "Definition of confidential info, obligations, permitted disclosures, and survival.",
    tags: ["ip", "general"],
  },
  {
    id: "ip-ownership",
    name: "IP Ownership",
    description: "Background vs. foreground IP; assignment or license to deliverables.",
    tags: ["ip"],
  },
  {
    id: "license-grant",
    name: "License Grant",
    description: "Scope, territory, exclusivity, sublicensing, and restrictions.",
    tags: ["ip"],
  },
  {
    id: "employee-confidentiality",
    name: "Employee Confidentiality",
    description: "Employee duties to protect company information and inventions.",
    tags: ["ip", "hr"],
  },

  // Liability / warranties
  {
    id: "warranties-and-disclaimers",
    name: "Warranties & Disclaimers",
    description: "What you warrant vs. what is disclaimed; remedy limits.",
    tags: ["liability"],
  },
  {
    id: "indemnification",
    name: "Indemnification",
    description: "Who defends and pays for third-party claims (IP, bodily injury, data breach).",
    tags: ["liability"],
  },
  {
    id: "limitation-of-liability",
    name: "Limitation of Liability",
    description: "Caps, exclusions (consequential), and special carve-outs.",
    tags: ["liability"],
  },
  {
    id: "insurance",
    name: "Insurance",
    description: "Required coverages (CGL, cyber, E&O) and certificates.",
    tags: ["liability"],
  },

  // Terms & termination
  {
    id: "term-and-renewal",
    name: "Term & Renewal",
    description: "Initial term, renewals (auto/manual), and review cycles.",
    tags: ["general"],
  },
  {
    id: "termination",
    name: "Termination",
    description: "For convenience/cause, cure periods, and effects of termination.",
    tags: ["general"],
  },
  {
    id: "suspension",
    name: "Suspension",
    description: "Grounds to suspend services or access and notice rules.",
    tags: ["general"],
  },

  // Privacy / compliance
  {
    id: "data-protection-and-privacy",
    name: "Data Protection & Privacy",
    description: "Data roles, cross-border transfers, sub-processors, and security measures.",
    tags: ["privacy", "compliance"],
  },
  {
    id: "dpa-reference",
    name: "DPA Reference",
    description: "Incorporates a Data Processing Addendum and priority of terms.",
    tags: ["privacy", "compliance"],
  },
  {
    id: "compliance-with-law",
    name: "Compliance with Law",
    description: "Compliance with applicable laws (export, sanctions, anti-bribery).",
    tags: ["compliance"],
  },

  // Disputes
  {
    id: "governing-law-and-jurisdiction",
    name: "Governing Law & Jurisdiction",
    description: "Choice of law and venue/courts; conflict-of-laws waiver.",
    tags: ["disputes", "boilerplate"],
  },
  {
    id: "arbitration-and-dispute-resolution",
    name: "Arbitration & Dispute Resolution",
    description: "ADR sequence: good-faith negotiation → mediation → arbitration.",
    tags: ["disputes"],
  },

  // Boilerplate
  {
    id: "assignment-and-delegation",
    name: "Assignment & Delegation",
    description: "Rights to assign, change of control, and subcontracting.",
    tags: ["boilerplate"],
  },
  {
    id: "force-majeure",
    name: "Force Majeure",
    description: "Excused performance for extraordinary events and notice obligations.",
    tags: ["boilerplate"],
  },
  {
    id: "notices",
    name: "Notices",
    description: "How notices are given (email/post), when deemed received, and contacts.",
    tags: ["boilerplate"],
  },
  {
    id: "waiver",
    name: "Waiver",
    description: "No implied waivers; written waiver requirement.",
    tags: ["boilerplate"],
  },
  {
    id: "severability",
    name: "Severability",
    description: "If a clause is invalid, the rest remain enforceable.",
    tags: ["boilerplate"],
  },
  {
    id: "entire-agreement",
    name: "Entire Agreement (Integration)",
    description: "This agreement supersedes prior proposals; order of precedence.",
    tags: ["boilerplate"],
  },
  {
    id: "counterparts-and-e-signatures",
    name: "Counterparts & e-Signatures",
    description: "Execution in counterparts and acceptance of electronic signatures.",
    tags: ["boilerplate"],
  },
];
