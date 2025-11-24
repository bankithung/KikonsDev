import Link from "next/link";
import { BarChart3, Shield, Lock, Eye, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 font-heading">Privacy Policy</h1>
                <p className="text-sm text-slate-500 mt-1 font-body">Last updated: November 22, 2025</p>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none font-body">
            <Section title="1. Information We Collect" icon={Database}>
              <p>We collect information you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email, company details)</li>
                <li>Student data you input (names, contact info, academic records)</li>
                <li>Payment and billing information</li>
                <li>Communications with our support team</li>
              </ul>
            </Section>

            <Section title="2. How We Use Your Information" icon={Eye}>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send receipts</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your requests and questions</li>
                <li>Protect against fraudulent or unauthorized activity</li>
              </ul>
            </Section>

            <Section title="3. Data Security" icon={Lock}>
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>End-to-end encryption for sensitive data</li>
                <li>Regular security audits and penetration testing</li>
                <li>Secure data centers with 99.9% uptime SLA</li>
                <li>Role-based access control within your organization</li>
                <li>Automated backups and disaster recovery</li>
              </ul>
            </Section>

            <Section title="4. Data Retention">
              <p>We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your data at any time by contacting support@consultancydev.com.</p>
            </Section>

            <Section title="5. Your Rights">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </Section>

            <Section title="6. Contact Us">
              <p>If you have questions about this Privacy Policy, please contact us at:</p>
              <p className="font-medium">Email: privacy@consultancydev.com</p>
              <p className="font-medium">Phone: +91 98765 43210</p>
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
            <Icon size={18} />
          </div>
        )}
        <h2 className="text-2xl font-bold text-slate-900 font-heading">{title}</h2>
      </div>
      <div className="text-slate-600 space-y-4 leading-relaxed">{children}</div>
    </div>
  );
}

