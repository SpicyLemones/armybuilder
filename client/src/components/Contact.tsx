// src/pages/Contact.tsx (or a modal)
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.target as HTMLFormElement).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setOk(res.ok);
      if (res.ok) (e.target as HTMLFormElement).reset();
    } catch {
      setOk(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input name="name" placeholder="Your name" />
      <Input name="email" type="email" placeholder="Your email (optional)" />
      <Textarea name="message" placeholder="How can I help?" required minLength={5} />
      <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send"}</Button>
      {ok === true && <p className="text-green-600 text-sm">Thanks! I’ll get back to you.</p>}
      {ok === false && <p className="text-red-600 text-sm">Couldn’t send—try again.</p>}
    </form>
  );
}
