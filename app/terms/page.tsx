
"use client";

import React from "react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Zero-Tolerance Cyberbullying Policy</h2>
        <p className="mb-4">
          This platform maintains a strict zero-tolerance policy against cyberbullying, harassment, hate speech,
          defamation, or any form of inappropriate content or conduct. Users found engaging in such activities
          will face immediate account termination and potential reporting to school authorities or law enforcement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Privacy & Unmasking Consent</h2>
        <p className="mb-4">
          While voting and compliment submissions are generally anonymous to other users, you explicitly consent
          to platform administrators reserving the right to "unmask" voter identities. This action will only be
          taken in cases of suspected cyberbullying, misuse, or violation of these terms, and records may be
          handed over to school authorities or law enforcement as deemed necessary.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. AI Disclaimers & "AS IS" Waiver</h2>
        <p className="mb-4">
          This application is developed with the assistance of artificial intelligence models. The platform is
          provided "AS IS" without any guarantees of uptime, accuracy, or uninterrupted service. We do not warrant
          that the functions contained in the application will be uninterrupted or error-free, that defects will be
          corrected, or that the application or the server that makes it available are free of viruses or other
          harmful components.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability</h2>
        <p className="mb-4">
          To the fullest extent permitted by applicable law, the platform owners, developers, and hosting maintainers
          shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss
          of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other
          intangible losses, resulting from (a) your access to or use of or inability to access or use the application;
          (b) any conduct or content of any third party on the application; (c) any content obtained from the application;
          and (d) unauthorized access, use, or alteration of your transmissions or content. You agree to indemnify and
          hold harmless the platform owners, developers, and hosting maintainers from any claims, damages, or disputes
          arising from user-generated content or platform usage.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Minimum Age Requirement</h2>
        <p className="mb-4">
          This platform is intended for use by high school students aged 13 and older. By using this application,
          you confirm that you meet this age requirement.
        </p>
      </section>
    </div>
  );
}
