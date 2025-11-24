import Link from "next/link";
import { BarChart3, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <BarChart3 className="text-white h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">Consultancy<span className="text-teal-600">Dev</span></span>
          </Link>
          <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <FileText size={24} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 font-heading">Terms of Service</h1>
                <p className="text-sm text-slate-500 mt-1 font-body">Last updated: November 22, 2025</p>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none font-body space-y-10">
            <Section title="1. Acceptance of Terms">
              <p>By accessing and using Consultancy Dev, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
            </Section>

            <Section title="2. Description of Service">
              <p>Consultancy Dev provides a cloud-based software platform for educational consultancies to manage student enquiries, registrations, enrollments, documents, and payments.</p>
            </Section>

            <Section title="3. Account Registration">
              <ul className="list-disc pl-6 space-y-2">
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>One account per company/organization</li>
              </ul>
            </Section>

            <Section title="4. Subscription and Payment">
              <ul className="list-disc pl-6 space-y-2">
                <li>Subscriptions are billed monthly in advance</li>
                <li>Prices are subject to change with 30 days notice</li>
                <li>Refunds are available within 7 days of purchase</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
            </Section>

            <Section title="5. Data Ownership">
              <p>You retain all rights to the data you input into our system. We claim no ownership over your student records, documents, or business data.</p>
            </Section>

            <Section title="6. Acceptable Use">
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the service for any illegal purposes</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Upload malicious code or viruses</li>
                <li>Resell or redistribute our service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </Section>

            <Section title="7. Service Availability">
              <p>We strive for 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance will be announced in advance.</p>
            </Section>

            <Section title="8. Termination">
              <p>Either party may terminate the agreement with 30 days written notice. Upon termination, you will have 30 days to export your data.</p>
            </Section>

            <Section title="9. Contact">
              <p>For questions about these Terms, contact us at legal@consultancydev.com</p>
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-4 font-heading">{title}</h2>
      <div className="text-slate-600 space-y-4 leading-relaxed">{children}</div>
    </div>
  );
}

