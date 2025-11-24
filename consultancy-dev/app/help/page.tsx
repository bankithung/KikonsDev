import Link from "next/link";
import { BarChart3, HelpCircle, Book, Video, MessageCircle, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function HelpPage() {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 font-heading">Help Center</h1>
            <p className="text-xl text-slate-600 mb-8 font-body">
              Find answers, learn best practices, and get the most out of Consultancy Dev.
            </p>
            
            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search for help articles..." 
                className="pl-12 h-14 text-base border-slate-300 shadow-sm"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="bg-gradient-to-br from-teal-50 to-white border-b border-slate-100">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white mb-4">
                  <Book size={24} />
                </div>
                <CardTitle className="text-lg font-heading">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 font-body">
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="hover:text-teal-600 cursor-pointer">→ Quick start guide</li>
                  <li className="hover:text-teal-600 cursor-pointer">→ Setting up your company</li>
                  <li className="hover:text-teal-600 cursor-pointer">→ Adding team members</li>
                  <li className="hover:text-teal-600 cursor-pointer">→ Creating your first enquiry</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b border-slate-100">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4">
                  <Video size={24} />
                </div>
                <CardTitle className="text-lg font-heading">Video Tutorials</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 font-body">
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="hover:text-teal-600 cursor-pointer">→ Platform overview (5 min)</li>
                  <li className="hover:text-teal-600 cursor-pointer">→ Managing enquiries (8 min)</li>
                  <li className="hover:text-teal-600 cursor-pointer">→ Document management (6 min)</li>
                  <li className="hover:text-teal-600 cursor-pointer">→ Payment processing (7 min)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-white border-b border-slate-100">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white mb-4">
                  <MessageCircle size={24} />
                </div>
                <CardTitle className="text-lg font-heading">Support</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 font-body">
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="hover:text-teal-600 cursor-pointer">→ Contact support team</li>
                  <li className="hover:text-teal-600 cursor-pointer">→ Report a bug</li>
                  <li className="hover:text-teal-600 cursor-pointer">→ Request a feature</li>
                  <li className="hover:text-teal-600 cursor-pointer">→ Schedule a demo call</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 font-heading">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <details key={i} className="group bg-slate-50 rounded-lg border border-slate-200 p-6 hover:bg-white transition-colors">
                  <summary className="cursor-pointer font-semibold text-slate-900 font-heading flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-teal-600 shrink-0" />
                    {faq.q}
                  </summary>
                  <p className="mt-4 text-slate-600 pl-8 font-body leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const FAQS = [
  {
    q: "How do I get started with Consultancy Dev?",
    a: "Sign up for a free 14-day trial, complete your company profile, and invite your team. Our onboarding wizard will guide you through the setup process."
  },
  {
    q: "Can I import data from Excel or other systems?",
    a: "Yes! We provide data import tools for Excel, CSV, and can assist with migration from other CRM systems. Contact our support team for assistance."
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use bank-level encryption, secure data centers, and regular security audits. Your data is backed up daily and you can export it anytime."
  },
  {
    q: "What happens after my trial ends?",
    a: "You can choose a plan that fits your needs. Your data remains accessible and you can continue using the platform seamlessly."
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can cancel anytime with 30 days notice. We'll provide a full data export before your account closes."
  },
];

