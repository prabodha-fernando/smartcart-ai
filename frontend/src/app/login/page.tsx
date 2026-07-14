"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCreateAccount, useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { getAuthUser } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShoppingCart,
  User,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  CreateAccountPayload,
  LoginResponse,
  User as AuthUser,
} from "@/types/user";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const createAccountMutation = useCreateAccount();
  const login = useAuthStore((state) => state.login);

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("emily.johnson@x.dummyjson.com");
  const [password, setPassword] = useState("emilyspass");
  const [showPassword, setShowPassword] = useState(false);
  const [signup, setSignup] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const submitLogin = async (credentials = { email, password }) => {
    const normalizedCredentials = {
      email: credentials.email.trim(),
      password: credentials.password,
    };

    try {
      const tokens = await withTimeout(
        loginMutation.mutateAsync(normalizedCredentials),
        6000
      );
      const user = await getUserForTokens(tokens);

      signInUser(user, tokens);
      router.push("/");
    } catch (error) {
      console.warn("Login failed:", error);
      toast.error("Login failed. Check your email and password.");
    }
  };

  const signInUser = (user: AuthUser, tokens: LoginResponse) => {
    login(user, tokens);
    queryClient.setQueryData(["auth-user"], user);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLogin();
  };

  const handleGuestLogin = async () => {
    setEmail("emily.johnson@x.dummyjson.com");
    setPassword("emilyspass");
    await submitLogin({
      email: "emily.johnson@x.dummyjson.com",
      password: "emilyspass",
    });
  };

  const updateSignup = (field: keyof typeof signup, value: string) => {
    setSignup((current) => ({ ...current, [field]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = signup.name.trim();
    const email = signup.email.trim();
    const signupPassword = signup.password;

    if (!name || !email) {
      toast.error("Please fill in all account details.");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (signupPassword !== signup.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const payload: CreateAccountPayload = {
      name,
      email,
      password: signupPassword,
    };

    try {
      await withTimeout(createAccountMutation.mutateAsync(payload), 6000);

      setEmail(payload.email);
      setPassword("");
      setSignup({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setAuthMode("login");
      toast.success("Account created. Please sign in to continue.");
    } catch (error) {
      // The account already exists on the backend — send them to sign in.
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setEmail(payload.email);
        setPassword("");
        setAuthMode("login");
        toast.error(
          "An account with that email already exists. Please sign in."
        );
        return;
      }

      console.error("Create account failed:", error);
      toast.error("Could not create account. Please try again.");
    }
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

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="mt-20 max-w-md"
            >
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
            </motion.div>
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
          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={authMode === "login" ? handleLogin : handleCreateAccount}
            className="w-full max-w-[440px] rounded-[20px] border border-slate-200 bg-slate-50 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          >
            <header className="mb-8">
              <h2 className="font-display text-[32px] font-semibold leading-tight">
                {authMode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {authMode === "login"
                  ? "Please enter your details to access your cart."
                  : "Create your account, then sign in to continue."}
              </p>
            </header>

            <div className="space-y-4">
              {authMode === "signup" && (
                <TextField
                  label="Full Name"
                  value={signup.name}
                  onChange={(value) => updateSignup("name", value)}
                  placeholder="Jane Cooper"
                  icon={<User size={22} />}
                />
              )}

              <TextField
                label="Email"
                value={authMode === "login" ? email : signup.email}
                onChange={(value) =>
                  authMode === "login"
                    ? setEmail(value)
                    : updateSignup("email", value)
                }
                placeholder="name@example.com"
                icon={<Mail size={22} />}
                type="email"
              />

              <label className="block space-y-2">
                <span className="flex items-center justify-between px-1 text-[13px] font-medium text-slate-800">
                  Password
                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={() =>
                        toast(
                          "Use the demo account: emily.johnson@x.dummyjson.com / emilyspass"
                        )
                      }
                      className="text-blue-700 transition hover:opacity-70"
                    >
                      Forgot?
                    </button>
                  )}
                </span>
                <span className="flex h-14 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-slate-500 transition focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20">
                  <Lock size={22} />
                  <input
                    className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                    value={authMode === "login" ? password : signup.password}
                    onChange={(e) =>
                      authMode === "login"
                        ? setPassword(e.target.value)
                        : updateSignup("password", e.target.value)
                    }
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

              {authMode === "signup" && (
                <TextField
                  label="Confirm Password"
                  value={signup.confirmPassword}
                  onChange={(value) => updateSignup("confirmPassword", value)}
                  placeholder="••••••••"
                  icon={<Lock size={22} />}
                  type={showPassword ? "text" : "password"}
                />
              )}

              {authMode === "login" && (
                <label className="flex items-center gap-2 px-1 pt-1 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-blue-700"
                  />
                  Remember me for 30 days
                </label>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending || createAccountMutation.isPending}
                className="primary-pill mt-4 flex h-14 w-full items-center justify-center gap-2 text-base font-medium shadow-lg shadow-blue-700/20 transition active:scale-[0.98] disabled:opacity-60"
              >
                {authMode === "login"
                  ? loginMutation.isPending
                    ? "Signing in..."
                    : "Sign In"
                  : createAccountMutation.isPending
                  ? "Creating account..."
                  : "Create Account"}
                <ArrowRight size={22} />
              </button>

              {authMode === "login" && (
                <div className="flex items-center gap-4 py-4 text-xs font-medium uppercase tracking-[0.05em] text-slate-500">
                  <span className="h-px flex-1 bg-slate-300" />
                  OR
                  <span className="h-px flex-1 bg-slate-300" />
                </div>
              )}

              {authMode === "login" && (
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  <User size={18} />
                  Continue as Guest
                </button>
              )}

              <p className="pt-1 text-center text-sm text-slate-700">
                {authMode === "login" ? "New here?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() =>
                    setAuthMode((current) =>
                      current === "login" ? "signup" : "login"
                    )
                  }
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {authMode === "login" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>
          </motion.form>
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

function TextField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="px-1 text-[13px] font-medium text-slate-800">
        {label}
      </span>
      <span className="flex h-14 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-slate-500 transition focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700/20">
        {icon}
        <input
          className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          required
        />
      </span>
    </label>
  );
}

async function getUserForTokens(tokens: LoginResponse): Promise<AuthUser> {
  try {
    return await withTimeout(getAuthUser(tokens.accessToken), 5000);
  } catch (error) {
    console.warn("Using login response profile:", error);
    return buildUserFromLoginResponse(tokens);
  }
}

function buildUserFromLoginResponse(tokens: LoginResponse): AuthUser {
  return tokens.user;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Request timed out"));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });
}
