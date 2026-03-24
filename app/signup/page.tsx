"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, setToken } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await auth.signup({ name, email, password });
      setToken(data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EDD9] flex items-center justify-center p-4">
      <div className="animate-slide-up w-full max-w-md">
        <div className="premium-card p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#f5eed8] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🤖</div>
            <h1 className="text-3xl font-serif font-bold text-[#1B1C15]">ActionBot</h1>
            <p className="text-[rgba(0,0,0,0.5)] mt-2 text-[15px]">Create your account</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Business Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="premium-input" placeholder="Your Business" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="premium-input" placeholder="you@company.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="premium-input" placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-premium w-full justify-center text-[15px] py-3.5">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-[rgba(0,0,0,0.5)] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1B1C15] font-semibold hover:opacity-60 transition-opacity">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
