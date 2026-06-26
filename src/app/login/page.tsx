"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { getAuthUser } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("emilys");
  const [password, setPassword] = useState("emilyspass");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const tokens = await loginMutation.mutateAsync({
        username,
        password,
      });

      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

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

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border"
      >
        <h1 className="text-3xl font-bold text-gray-900">SmartCart AI</h1>

        <p className="mt-2 text-gray-500">
          Login to continue shopping smarter.
        </p>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border px-4 py-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>

          {loginMutation.isError && (
            <p className="text-sm text-red-500">
              Login failed. Check username/password.
            </p>
          )}
        </div>
      </form>
    </main>
  );
}