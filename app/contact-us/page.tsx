'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import { submitPublicSupportEmail } from '@/app/lib/public-cms';

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    mobileNumber: '',
    isCompany: false,
    companyName: '',
    address: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) next.email = 'Invalid email';
    if (!formData.name.trim()) next.name = 'Name is required';
    if (!formData.message.trim()) next.message = 'Message is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      await submitPublicSupportEmail({
        email: formData.email.trim(),
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber.trim() || undefined,
        isCompany: formData.isCompany,
        companyName: formData.companyName.trim() || undefined,
        address: formData.address.trim() || undefined,
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim() || undefined,
      });
      setSuccess(true);
      setFormData({
        email: '',
        name: '',
        mobileNumber: '',
        isCompany: false,
        companyName: '',
        address: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to send. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="naad-site naad-cms-shell">
      <header className="naad-horoscope-intro naad-cms-intro">
        <nav className="naad-cms-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <span>Contact us</span>
        </nav>
        <h1>Contact us</h1>
        <p>Send a message to the Naad team — we typically reply by email.</p>
      </header>

      <div className="naad-section-inner naad-cms-content">
        <div className="naad-contact-card">
          {success ? (
            <div className="naad-contact-success">
              <p>Thank you. Your message was sent successfully.</p>
              <button type="button" className="naad-btn-primary" onClick={() => setSuccess(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="naad-contact-form" onSubmit={handleSubmit} noValidate>
              <label className="naad-converter-field">
                <span>Name *</span>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
                {errors.name ? <em className="naad-field-error">{errors.name}</em> : null}
              </label>

              <label className="naad-converter-field">
                <span>Email *</span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email ? <em className="naad-field-error">{errors.email}</em> : null}
              </label>

              <label className="naad-converter-field">
                <span>Mobile</span>
                <input
                  name="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </label>

              <label className="naad-converter-field">
                <span>Subject</span>
                <input
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </label>

              <label className="naad-converter-field">
                <span>Message *</span>
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                />
                {errors.message ? <em className="naad-field-error">{errors.message}</em> : null}
              </label>

              <label className="naad-contact-check">
                <input
                  name="isCompany"
                  type="checkbox"
                  checked={formData.isCompany}
                  onChange={handleChange}
                />
                <span>I am contacting on behalf of a company</span>
              </label>

              {formData.isCompany ? (
                <>
                  <label className="naad-converter-field">
                    <span>Company name</span>
                    <input
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </label>
                  <label className="naad-converter-field">
                    <span>Address</span>
                    <input
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </label>
                </>
              ) : null}

              {errors.submit ? <p className="naad-converter-error">{errors.submit}</p> : null}

              <button type="submit" className="naad-btn-primary" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
