"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { getAuthUser } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShoppingCart,
  User,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("emilys");
  const [password, setPassword] = useState("emilyspass");
  const [showPassword, setShowPassword] = useState(false);

  const submitLogin = async (credentials = { username, password }) => {
    try {
      const tokens = await loginMutation.mutateAsync({
        username: credentials.username,
        password: credentials.password,
      });

      useAuthStore.getState().setTokens(
        tokens.accessToken,
        tokens.refreshToken
      );

      await queryClient.invalidateQueries({
        queryKey: ["auth-user"],
      });

      const user = await getAuthUser();

      login(user, tokens);

      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLogin();
  };

  const handleGuestLogin = async () => {
    setUsername("emilys");
    setPassword("emilyspass");
    await submitLogin({ username: "emilys", password: "emilyspass" });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <div className="flex min-h-screen flex-col md:flex-row">
        <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#f1f3ff] p-8 md:flex">
          <div className="absolute right-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-700/5 blur-[100px]" />

          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-3 font-display text-2xl font-semibold tracking-tight">
              <ShoppingCart className="text-blue-700" size={32} />
              SmartCart AI
            </div>

            <div className="mt-20 max-w-md">
              <h1 className="font-display text-5xl font-bold leading-[1.1]">
                Shop Smarter{" "}
                <br />
                with AI
              </h1>
              <p className="mt-6 text-lg leading-[1.6] text-slate-700">
                Experience a curated commerce journey where intelligent
                insights meet elegant design. Your personal shopping assistant
                awaits.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-center py-8">
            <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-[40px] shadow-2xl motion-safe:animate-[loginFloat_6s_ease-in-out_infinite]">
              <Image
                src="/wireframes/login-hero.png"
                alt="3D shopping cart illustration"
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-700/10 to-transparent" />
            </div>
          </div>

          <div className="relative z-10 flex gap-4 pb-14">
            {["Curated Insights", "Seamless Checkout"].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm"
              >
                <CheckCircle2 size={18} className="text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center bg-[#f9f9ff] px-8 pb-4 pt-8 md:hidden">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="text-blue-700" size={28} />
            <span className="font-display text-2xl font-semibold tracking-tight">
              SmartCart AI
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold">
            Shop Smarter with AI
          </h1>
        </section>

        <section className="flex flex-1 items-center justify-center bg-white p-8">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-[440px] rounded-[20px] border border-slate-200 bg-slate-50 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300"
          >
            <header className="mb-8">
              <h2 className="font-display text-[32px] font-semibold leading-tight">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Please enter your details to access your cart.
              </p>
            </header>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="px-1 text-[13px] font-medium text-slate-800">
                  Username or Email
                </span>
                <span className="flex h-14 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-slate-500 transition focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20">
                  <User size={22} />
                  <input
                    className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="name@example.com"
                  />
                </span>
              </label>

              <label className="block space-y-2">
                <span className="flex items-center justify-between px-1 text-[13px] font-medium text-slate-800">
                  Password
                  <button
                    type="button"
                    onClick={() =>
                      toast("Use the demo account: emilys / emilyspass")
                    }
                    className="text-blue-700 transition hover:opacity-70"
                  >
                    Forgot?
                  </button>
                </span>
                <span className="flex h-14 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-slate-500 transition focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20">
                  <Lock size={22} />
                  <input
                    className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="transition hover:text-slate-900"
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </span>
              </label>

              <label className="flex items-center gap-2 px-1 pt-1 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-blue-700"
                />
                Remember me for 30 days
              </label>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="primary-pill mt-4 flex h-14 w-full items-center justify-center gap-2 text-base font-medium shadow-lg shadow-blue-700/20 transition active:scale-[0.98] disabled:opacity-60"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
                <ArrowRight size={22} />
              </button>

              {loginMutation.isError && (
                <p className="text-sm text-red-500">
                  Login failed. Check username/password.
                </p>
              )}

              <div className="flex items-center gap-4 py-4 text-xs font-medium uppercase tracking-[0.05em] text-slate-500">
                <span className="h-px flex-1 bg-slate-300" />
                OR
                <span className="h-px flex-1 bg-slate-300" />
              </div>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                <User size={18} />
                Continue as Guest
              </button>

              <p className="pt-1 text-center text-sm text-slate-700">
                New here?{" "}
                <button
                  type="button"
                  onClick={() =>
                    toast("DummyJSON auth uses the provided demo users.")
                  }
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
          </form>
        </section>
      </div>

      <footer className="fixed bottom-0 left-0 hidden w-1/2 px-8 py-6 md:block">
        <div className="flex gap-4">
          {["Privacy Policy", "Terms of Service", "Help Center"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toast(`${item} page is not included in this demo.`)}
              className="text-[13px] font-medium text-slate-500 transition hover:text-blue-700"
            >
              {item}
            </button>
          ))}
        </div>
      </footer>
    </main>
  );
}
