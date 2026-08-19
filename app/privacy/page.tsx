"use client";

import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Student ID Data Handling</h2>
        <p className="mb-4">
          Uploaded student ID photos are strictly stored in private Supabase Storage buckets. Access to these
          photos is restricted to designated platform administrators solely for the purpose of identity verification.
          We guarantee that your student ID data will never be shared, sold, or distributed to third parties.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
        <p className="mb-4">
          We collect information you provide directly to us, such as when you create an account, update your profile,
          participate in polls, or contact us. This may include your name, grade, school, username, and avatar.
          We also collect certain information automatically when you use our services, such as your IP address,
          device information, and usage data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
        <p className="mb-4">
          We use the information we collect to provide, maintain, and improve our services, to personalize your
          experience, to communicate with you, and to ensure the security and integrity of our platform.
          We may also use your information to enforce our Terms of Service and to comply with legal obligations.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
        <p className="mb-4">
          We do not share or sell your personal information to third parties for their marketing purposes.
          We may share your information with service providers who perform services on our behalf, such as
          hosting, data analysis, and customer support. We may also disclose your information if required by law
          or in response to a valid legal process, or to protect the rights, property, or safety of our users
          or the public.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
        <p className="mb-4">
          We implement reasonable security measures to protect your information from unauthorized access,
          disclosure, alteration, and destruction. However, no method of transmission over the internet or
          electronic storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Your Choices</h2>
        <p className="mb-4">
          You may update or correct your profile information at any time through your account settings.
          You may also have the right to access, delete, or restrict the processing of your personal information
          under applicable data protection laws.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting
          the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically
          for any changes.
        </p>
      </section>
    </div>
  );
}
