"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuthUser } from "@/hooks/useAuth";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import { Briefcase, GraduationCap, LogOut, MapPin, Pencil, Save, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useAuthUser();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        {isLoading && <p className="p-10">Loading profile...</p>}

        {isError && (
          <p className="p-10 text-red-500">Failed to load profile.</p>
        )}

        {user && (
          <>
            <section className="bg-slate-50 py-20 md:py-28">
              <div className="app-container flex flex-col gap-10 md:flex-row md:items-end">
                <div className="relative h-56 w-56 overflow-hidden rounded-full border-8 border-white bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                  <Image
                    src={user.image}
                    alt={user.firstName}
                    fill
                    sizes="224px"
                    className="object-cover"
                  />
                  <button
                    onClick={() => toast("Profile photo editing is not available in DummyJSON.")}
                    className="absolute bottom-3 right-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg"
                  >
                    <Pencil size={22} />
                  </button>
                </div>

                <div className="pb-4">
                  <span className="rounded-full bg-blue-100 px-4 py-2 text-blue-700 label-caps">
                    Premium Member
                  </span>
                  <h1 className="mt-6 font-display text-4xl font-bold text-slate-950 md:text-6xl">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="mt-3 text-2xl text-slate-500">
                    {user.company.title} & Tech Enthusiast
                  </p>
                </div>
              </div>
            </section>

            <section className="app-container grid gap-8 py-16 lg:grid-cols-[2fr_1fr]">
              <Panel title="Personal Information" icon={User}>
                <div className="grid gap-8 md:grid-cols-2">
                  <InfoItem
                    label="Full Name"
                    value={`${user.firstName} ${user.maidenName} ${user.lastName}`}
                  />
                  <InfoItem label="Email Address" value={user.email} />
                  <InfoItem label="Phone Number" value={user.phone} />
                  <InfoItem label="Timezone" value="Pacific Time (PT)" />
                </div>
              </Panel>

              <Panel title="Professional" icon={Briefcase} highlighted>
                <div className="space-y-7">
                  <InfoItem label="Company" value={user.company.name} />
                  <InfoItem label="Role" value={user.company.title} />
                  <InfoItem label="Department" value={user.company.department} />
                </div>
              </Panel>

              <Panel title="Primary Residence" icon={MapPin}>
                <div className="grid gap-8 md:grid-cols-4">
                  <InfoItem label="Street Address" value={user.address.address} wide />
                  <InfoItem label="City" value={user.address.city} />
                  <InfoItem label="State" value={user.address.state} />
                  <InfoItem label="Zip" value={user.address.postalCode} />
                  <InfoItem label="Country" value={user.address.country} />
                </div>
              </Panel>

              <div className="space-y-8">
                <Panel title="Education" icon={GraduationCap}>
                  <div className="space-y-6">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {user.university}
                      </p>
                      <p className="mt-1 text-slate-500">
                        M.S. in Human-Computer Interaction
                      </p>
                    </div>
                    <div className="border-t border-slate-200 pt-6">
                      <p className="font-semibold text-slate-950">RISD</p>
                      <p className="mt-1 text-slate-500">
                        B.F.A. in Graphic Design
                      </p>
                    </div>
                  </div>
                </Panel>

                <button
                  onClick={() => toast.success("Profile changes saved locally")}
                  className="primary-pill flex w-full items-center justify-center gap-3 px-6 py-5 text-lg font-semibold"
                >
                  <Save size={21} />
                  Update Changes
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-red-200 px-6 py-5 text-lg font-semibold text-red-600"
                >
                  <LogOut size={21} />
                  Logout Session
                </button>
              </div>
            </section>
          </>
        )}

        <Footer />
      </main>
    </ProtectedRoute>
  );
}

function Panel({
  title,
  icon: Icon,
  highlighted = false,
  children,
}: {
  title: string;
  icon: typeof User;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[20px] bg-slate-50 p-9 transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] ${
        highlighted ? "border border-teal-200" : ""
      }`}
    >
      <h2 className="mb-8 flex items-center gap-4 font-display text-3xl font-semibold text-slate-950">
        <Icon className="text-blue-700" size={28} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-4" : ""}>
      <p className="label-caps text-slate-500">{label}</p>
      <p className="mt-3 text-xl text-slate-950">{value}</p>
    </div>
  );
}
