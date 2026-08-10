"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearch } from "../../lib/api/search";
import { useDebouncedValue } from "../../lib/hooks/useDebouncedValue";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useSearch(debouncedQuery, 1, 6);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      setIsFocused(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const showDropdown = isFocused && debouncedQuery.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Dokümanlarda ara..."
          className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm text-zinc-900 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl border border-zinc-100 bg-white p-2 shadow-xl"
          >
            {isFetching && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
                <Loader2 size={16} className="animate-spin" /> Aranıyor...
              </div>
            )}
            {!isFetching && data?.results.length === 0 && <p className="px-3 py-6 text-center text-sm text-zinc-400">Sonuç bulunamadı</p>}
            {!isFetching &&
              data?.results.map((result) => (
                <Link
                  key={result.documentId}
                  href={`/documents/${result.documentId}`}
                  onClick={() => setIsFocused(false)}
                  className="flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  <FileText size={15} className="mt-0.5 shrink-0 text-primary-500" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">{result.title}</p>
                    <p className="truncate text-xs text-zinc-500">{result.snippet}</p>
                  </div>
                </Link>
              ))}
            {data && data.results.length > 0 && (
              <Link
                href={`/search?q=${encodeURIComponent(debouncedQuery)}`}
                onClick={() => setIsFocused(false)}
                className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-primary-600 hover:bg-primary-50"
              >
                Tüm sonuçları gör ({data.totalCount})
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
