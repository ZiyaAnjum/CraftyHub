import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, ArrowLeft, Heart, CheckCircle2 } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-blush-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-3 border-b border-blush-100 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blush-50 border border-blush-200 text-blush-700 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Consent</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Privacy Policy
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          At Fouzas Creation, we craft heartfelt bespoke creations. We treat your personal information, special messages, and photos with the exact same care and respect we give each handmade gift.
        </p>
        <p className="text-xs text-stone-400">
          Last updated: October 2026 • Effective for all customers and visitors
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cream-200 text-stone-700 text-xs flex items-center justify-center font-bold">1</span>
            Information We Collect
          </h2>
          <p>
            When you create an account, design a bespoke gift, or place an order, we collect only what is strictly necessary to bring your creation to life:
          </p>
          <ul className="space-y-2 list-disc list-inside text-stone-600 pl-2">
            <li><strong>Account details:</strong> Your full name, email address, and 10-digit Indian mobile number.</li>
            <li><strong>Order specifications:</strong> Occasion, recipient preferences, custom inscriptions/calligraphy text, budget range, and needed-by date.</li>
            <li><strong>Fulfilment details:</strong> Delivery address (if choosing doorstep courier) or self-pickup acknowledgement.</li>
            <li><strong>Reference media:</strong> Reference photos uploaded to illustrate your preferred theme or design.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cream-200 text-stone-700 text-xs flex items-center justify-center font-bold">2</span>
            How We Use Your Data
          </h2>
          <p>Your details are used exclusively for order fulfillment and customer service:</p>
          <ul className="space-y-2 list-disc list-inside text-stone-600 pl-2">
            <li>Artisans review your notes to create and personalize your gift.</li>
            <li>We provide live order updates, milestone tracking, and quotation confirmations via WhatsApp and our tracking portal.</li>
            <li>Your saved delivery address helps speed up future enquiries.</li>
            <li><strong>We NEVER sell, rent, or monetize your contact information or photos to third-party advertisers.</strong></li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cream-200 text-stone-700 text-xs flex items-center justify-center font-bold">3</span>
            Security & Photo Storage
          </h2>
          <p>
            We implement robust safeguards to protect your personal moments:
          </p>
          <ul className="space-y-2 list-disc list-inside text-stone-600 pl-2">
            <li>Passwords are hashed with high-cost <code>bcrypt</code> (cost factor 12) and never stored in plain text.</li>
            <li>Session cookies use secure, <code>httpOnly</code> flags to defend against XSS attacks.</li>
            <li>Reference photos are securely hosted in Cloudinary with strict MIME validation. If you delete an uploaded photo prior to placing an order, it is permanently removed from storage.</li>
            <li>Public tracking links show strictly sanitized statuses and never disclose recipient addresses, emails, or internal artisan notes.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cream-200 text-stone-700 text-xs flex items-center justify-center font-bold">4</span>
            Your Rights & Contact
          </h2>
          <p>
            You have full control over your details:
          </p>
          <ul className="space-y-2 list-disc list-inside text-stone-600 pl-2">
            <li>You can review and update your name, phone number, and saved address anytime in your <Link to="/account" className="text-blush-600 font-semibold underline">Account Profile</Link>.</li>
            <li>To inquire about any data or request complete account closure, contact us directly via WhatsApp or email.</li>
          </ul>
          <div className="pt-2 text-xs text-stone-500">
            <strong>Fouzas Creation Studio</strong> • Bengaluru, Karnataka, India • WhatsApp Support Available Mon–Sat
          </div>
        </section>
      </div>
    </div>
  );
}
export default PrivacyPolicyPage;
