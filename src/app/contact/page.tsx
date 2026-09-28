'use client';

import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Mail, MessageSquare, Send, CheckCircle2, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      <Breadcrumbs items={[{ label: 'Contact Us' }]} />

      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <MessageSquare size={14} />
            <span>Get in Touch</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Contact OnlineSaleLive
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Have a deal tip, spotted an expired discount, or want to collaborate with our editorial team? We would love to hear from you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Contact Information */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Contact Information</h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">Email Us</span>
                  <a
                    href="mailto:contact@onlinesalelive.in"
                    className="text-orange-600 hover:underline"
                  >
                    contact@onlinesalelive.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">Location</span>
                  <span>Bangalore, Karnataka, India</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">Response Time</span>
                  <span>We usually respond within 24 to 48 business hours.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-3xl p-6 border border-orange-200 text-xs text-orange-950 space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-orange-900">
              Spot a Broken Deal Link?
            </h4>
            <p className="leading-relaxed">
              Deals on Indian marketplaces fluctuate dynamically. If you notice a price that has changed or expired, send us the product URL and we will update our database immediately.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Message Received!
              </h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thank you for reaching out. A member of our research desk will review your inquiry and follow up shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '' });
                }}
                className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-bold text-slate-900 text-lg mb-2">Send a Message</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Expired deal report / Partnership inquiry"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Message Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us what you'd like to share or ask..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-900 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm py-3 px-6 rounded-xl transition-all shadow-md shadow-orange-600/20"
              >
                <Send size={16} />
                <span>Submit Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
