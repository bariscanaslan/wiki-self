"use client";

import { motion } from "framer-motion";
import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";
import { useSiteSettings } from "../lib/settings/SettingsContext";

export default function NotFound() {
  const { settings } = useSiteSettings();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-900 px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex max-w-md flex-col items-center text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
          <FileQuestion size={26} />
        </div>
        <p className="text-sm font-semibold tracking-wide text-primary-600 dark:text-primary-400">404</p>
        <h1 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">Sayfa bulunamadı</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Aradığınız sayfa taşınmış, silinmiş olabilir ya da hiç var olmamış olabilir.
          {settings?.siteTitle ? ` ${settings.siteTitle}'a devam etmek için anasayfaya dönebilirsiniz.` : ""}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <Home size={16} /> Anasayfaya dön
        </Link>
      </motion.div>
    </div>
  );
}
