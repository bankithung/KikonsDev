import Link from "next/link";
import { BarChart3, Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 font-heading">Get in Touch</h1>
            <p className="text-xl text-slate-600 font-body">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-slate-200">
                <CardContent className="p-8">
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium font-body">Full Name</Label>
                        <Input placeholder="Your name" className="h-11 border-slate-300" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium font-body">Email Address</Label>
                        <Input type="email" placeholder="you@company.com" className="h-11 border-slate-300" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium font-body">Subject</Label>
                      <Input placeholder="What can we help you with?" className="h-11 border-slate-300" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium font-body">Message</Label>
                      <textarea 
                        className="w-full min-h-[160px] px-3 py-2 border border-slate-300 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-body"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-lg font-semibold">
                      <Send className="mr-2 h-5 w-5" /> Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-slate-200 bg-gradient-to-br from-teal-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center text-white shrink-0">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1 font-heading">Email Us</h3>
                      <p className="text-sm text-slate-600 font-body">support@consultancydev.com</p>
                      <p className="text-sm text-slate-600 font-body">sales@consultancydev.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1 font-heading">Call Us</h3>
                      <p className="text-sm text-slate-600 font-body">+91 98765 43210</p>
                      <p className="text-xs text-slate-500 mt-1 font-body">Mon-Fri, 9AM-6PM IST</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1 font-heading">Visit Us</h3>
                      <p className="text-sm text-slate-600 font-body">
                        123 Business Park<br />
                        Tech City, Mumbai 400001<br />
                        India
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

