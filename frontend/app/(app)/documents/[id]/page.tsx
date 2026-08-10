"use client";

import { useParams } from "next/navigation";
import { DocumentPage } from "@/components/documents/DocumentPage";

export default function DocumentRoutePage() {
  const params = useParams<{ id: string }>();
  return <DocumentPage documentId={params.id} />;
}
