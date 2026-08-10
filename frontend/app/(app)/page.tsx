"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthContext";
import { useSiteSettings } from "../../lib/settings/SettingsContext";

export default function DashboardHomePage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  return (
    <div className="flex h-full items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex max-w-md flex-col items-center text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <BookOpen size={26} />
        </div>
        <h1 className="text-xl font-bold text-zinc-900">Hoş geldin, {user?.displayName}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {settings?.siteTitle || settings?.companyName || "WikiSelf"} dokümantasyon alanına hoş geldin. Başlamak için soldaki klasör
          ağacından bir doküman seç ya da yeni bir tane oluştur.
        </p>
      </motion.div>
    </div>
  );
}
