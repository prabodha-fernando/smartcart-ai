"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuthUser } from "@/hooks/useAuth";
import Image from "next/image";
import { motion } from "framer-motion";
import Footer from "@/components/layout/Footer";
import { Briefcase, GraduationCap, LogOut, MapPin, Pencil, Save, User, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { User as AuthUser } from "@/types/user";
import toast from "react-hot-toast";

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const EMPTY_FORM: ProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useAuthUser();
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  const setField = (key: keyof ProfileForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const startEditing = () => {
    if (!user) return;

    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address.address,
      city: user.address.city,
      state: user.address.state,
      postalCode: user.address.postalCode,
      country: user.address.country,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!user) return;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required.");
      return;
    }

    if (!form.email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const updated: AuthUser = {
      ...user,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: {
        ...user.address,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
      },
    };

    updateUser(updated);
    queryClient.setQueryData(["auth-user"], updated);
    setIsEditing(false);
    toast.success("Profile updated.");
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
            <section className="bg-slate-50 py-20">
              <div className="app-container flex flex-col gap-10 md:flex-row md:items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-56 w-56 overflow-hidden rounded-full border-8 border-white bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
                >
                  <Image
                    src={user.image}
                    alt={user.firstName}
                    fill
                    sizes="224px"
                    loading="eager"
                    className="object-cover"
                  />
                  <button
                    onClick={() => toast("Profile photo editing is not available in DummyJSON.")}
                    className="absolute bottom-3 right-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg"
                  >
                    <Pencil size={22} />
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                >
                  <span className="rounded-full bg-blue-100 px-4 py-2 text-blue-700 label-caps">
                    Premium Member
                  </span>
                  <h1 className="mt-6 font-display text-4xl font-bold text-slate-950 md:text-6xl">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="mt-3 text-2xl text-slate-500">
                    {user.company.title} & Tech Enthusiast
                  </p>
                </motion.div>
              </div>
            </section>

            <section className="app-container grid gap-8 py-16 lg:grid-cols-[2fr_1fr]">
              <Panel title="Personal Information" icon={User}>
                <div className="grid gap-8 md:grid-cols-2">
                  <InfoItem
                    label="First Name"
                    value={isEditing ? form.firstName : user.firstName}
                    editing={isEditing}
                    onChange={(value) => setField("firstName", value)}
                  />
                  <InfoItem
                    label="Last Name"
                    value={isEditing ? form.lastName : user.lastName}
                    editing={isEditing}
                    onChange={(value) => setField("lastName", value)}
                  />
                  <InfoItem
                    label="Email Address"
                    value={isEditing ? form.email : user.email}
                    editing={isEditing}
                    onChange={(value) => setField("email", value)}
                  />
                  <InfoItem
                    label="Phone Number"
                    value={isEditing ? form.phone : user.phone}
                    editing={isEditing}
                    onChange={(value) => setField("phone", value)}
                  />
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
                  <InfoItem
                    label="Street Address"
                    value={isEditing ? form.address : user.address.address}
                    editing={isEditing}
                    onChange={(value) => setField("address", value)}
                    wide
                  />
                  <InfoItem
                    label="City"
                    value={isEditing ? form.city : user.address.city}
                    editing={isEditing}
                    onChange={(value) => setField("city", value)}
                  />
                  <InfoItem
                    label="State"
                    value={isEditing ? form.state : user.address.state}
                    editing={isEditing}
                    onChange={(value) => setField("state", value)}
                  />
                  <InfoItem
                    label="Zip"
                    value={isEditing ? form.postalCode : user.address.postalCode}
                    editing={isEditing}
                    onChange={(value) => setField("postalCode", value)}
                  />
                  <InfoItem
                    label="Country"
                    value={isEditing ? form.country : user.address.country}
                    editing={isEditing}
                    onChange={(value) => setField("country", value)}
                  />
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

                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="primary-pill flex w-full items-center justify-center gap-3 px-6 py-5 text-lg font-semibold"
                    >
                      <Save size={21} />
                      Update Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 px-6 py-5 text-lg font-semibold text-slate-700"
                    >
                      <X size={21} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startEditing}
                      className="primary-pill flex w-full items-center justify-center gap-3 px-6 py-5 text-lg font-semibold"
                    >
                      <Pencil size={21} />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-3 rounded-full border border-red-200 px-6 py-5 text-lg font-semibold text-red-600"
                    >
                      <LogOut size={21} />
                      Logout Session
                    </button>
                  </>
                )}
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[1.5rem] bg-slate-50 p-9 ${
        highlighted ? "border border-teal-200" : ""
      }`}
    >
      <h2 className="mb-8 flex items-center gap-4 font-display text-3xl font-semibold text-slate-950">
        <Icon className="text-blue-700" size={28} />
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function InfoItem({
  label,
  value,
  wide = false,
  editing = false,
  onChange,
}: {
  label: string;
  value: string;
  wide?: boolean;
  editing?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={wide ? "md:col-span-4" : ""}>
      <p className="label-caps text-slate-500">{label}</p>
      {editing && onChange ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-xl text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20"
        />
      ) : (
        <p className="mt-3 text-xl text-slate-950">{value}</p>
      )}
    </div>
  );
}
