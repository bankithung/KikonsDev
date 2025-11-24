import Link from "next/link";
import { BarChart3, ArrowRight, Users, Target, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 font-heading">About Consultancy Dev</h1>
            <p className="text-xl text-slate-600 leading-relaxed font-body">
              We're on a mission to empower educational consultancies with modern technology that simplifies operations and accelerates growth.
            </p>
          </div>

          {/* Story */}
          <div className="mb-20">
            <Card className="border-slate-200">
              <CardContent className="p-8 sm:p-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 font-heading">Our Story</h2>
                <div className="space-y-4 text-slate-600 font-body leading-relaxed">
                  <p>
                    Founded in 2024, Consultancy Dev was born from a simple observation: educational consultancies were struggling with outdated, fragmented systems that made it difficult to track students, manage documents, and process payments efficiently.
                  </p>
                  <p>
                    We built a platform specifically for the education consultancy workflow—from the first enquiry call to final enrollment. Every feature is designed with consultancy owners and their teams in mind.
                  </p>
                  <p>
                    Today, we serve over 150+ consultancies across India, helping them manage thousands of student applications with ease, transparency, and speed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center font-heading">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Target, title: 'Purpose-Driven', desc: 'We build features that solve real problems for consultancies.' },
                { icon: Award, title: 'Excellence', desc: 'Uncompromising quality in design, code, and customer support.' },
                { icon: Heart, title: 'Customer First', desc: 'Your success is our success. We listen, adapt, and grow together.' },
              ].map((value, i) => (
                <Card key={i} className="border-slate-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-teal-600">
                      <value.icon size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 font-heading">{value.title}</h3>
                    <p className="text-slate-600 font-body">{value.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-teal-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4 font-heading">Ready to Join Us?</h2>
            <p className="text-xl opacity-90 mb-8 font-body">Start your 14-day free trial today. No credit card required.</p>
            <Button size="lg" variant="secondary" className="h-14 px-10 rounded-full font-bold text-teal-600" asChild>
              <Link href="/signup">Get Started Now <ArrowRight className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

