import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', issueType: '' });
  const [status, setStatus] = useState<'idle'|'loading'|'sent'|'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const { issueType, ...rest } = form;
      const payload = {
        ...rest,
        ticket_type: issueType.toLowerCase()
      };
      const res = await fetch('https://contact-service-rasanjim-traskelr-contact-service.2.rahtiapp.fi/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus('sent');
        setForm({ name: '', email: '', subject: '', message: '', issueType: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-monstera-light flex items-center justify-center py-12">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border-4 border-monstera-green">
        <h2 className="text-3xl font-bold text-monstera-dark mb-4">Contact Us</h2>
        <p className="text-monstera-brown mb-6">Have questions or feedback? Send us a message and we'll get back to you.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" required className="w-full px-4 py-3 border rounded-lg" />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required className="w-full px-4 py-3 border rounded-lg" />
          <select name="issueType" value={form.issueType} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg bg-white">
            <option value="" disabled>Select issue</option>
            <option value="General">General</option>
            <option value="Support">Support</option>
            <option value="Bug">Bug</option>
            <option value="Billing">Billing</option>
          </select>
          <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" className="w-full px-4 py-3 border rounded-lg" />
          <textarea name="message" value={form.message} onChange={handleChange} placeholder="Message" required className="w-full px-4 py-3 border rounded-lg h-32" />

          <div className="flex items-center gap-3">
            <button type="submit" disabled={status === 'loading'} className="bg-monstera-green hover:bg-monstera-dark text-white font-bold py-2 px-6 rounded-full transition">
              {status === 'loading' ? 'Sending...' : 'Send Message'}
            </button>
            <Link to="/" className="text-monstera-dark hover:underline">Back Home</Link>
          </div>
        </form>

        {status === 'sent' && <p className="mt-4 text-sm text-monstera-green">Message sent — thank you!</p>}
        {status === 'error' && <p className="mt-4 text-sm text-red-500">Failed to send. Try again later.</p>}
      </div>
    </div>
  );
}
