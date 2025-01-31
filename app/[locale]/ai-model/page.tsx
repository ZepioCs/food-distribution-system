"use client"

import Layout from "@/components/layout";
import AIModelInfo from "@/components/ai-model-info";
import { useRootStore } from "@/providers/store-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EUserRole } from "@/models/default";

export default function AIModelPage() {
  const { appStore } = useRootStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect non-admin users
    if (appStore.userRole !== EUserRole.ADMIN) {
      router.push('/dashboard');
    }
  }, [appStore.userRole, router]);

  if (appStore.userRole !== EUserRole.ADMIN) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <AIModelInfo />
      </div>
    </Layout>
  );
} 