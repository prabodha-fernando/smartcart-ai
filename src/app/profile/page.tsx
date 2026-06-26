"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuthUser } from "@/hooks/useAuth";
import Image from "next/image";

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useAuthUser();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <Navbar />

        {isLoading && <p className="p-10">Loading profile...</p>}

        {isError && (
          <p className="p-10 text-red-500">Failed to load profile.</p>
        )}

        {user && (
          <section className="mx-auto max-w-5xl px-6 py-10">
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <div className="flex items-center gap-6">
                <Image
                  src={user.image}
                  alt={user.firstName}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full"
                />

                <div>
                  <h1 className="text-3xl font-bold">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-gray-500">{user.email}</p>
                  <p className="text-blue-600">{user.role}</p>
                </div>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <ProfileCard title="Phone" value={user.phone} />
                <ProfileCard title="University" value={user.university} />
                <ProfileCard title="Company" value={user.company.name} />
                <ProfileCard title="Department" value={user.company.department} />
                <ProfileCard title="Job Title" value={user.company.title} />
                <ProfileCard
                  title="Address"
                  value={`${user.address.address}, ${user.address.city}`}
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}

function ProfileCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
