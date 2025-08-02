import { cn } from "@/lib/utils";
import { DashboardContent } from "../../../components/dashboard/dashboard-content";
import { BackgroundAALChecker } from "@/components/auth/background-aal-checker";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { isFlagEnabled } from "@/lib/feature-flags";

export default async function DashboardPage() {
  return (
    <BackgroundAALChecker>
      <div className="relative">
        {/* Elegant gradient background with light spots */}
        <div className="fixed inset-0 -z-10">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
          
          {/* Light spots for luminosity effect */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/50 dark:bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-40 w-80 h-80 bg-white/60 dark:bg-gray-800/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/40 dark:bg-white/5 rounded-full blur-3xl" />
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]" 
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} 
          />
        </div>
        
        <Suspense
          fallback={
            <div className="flex flex-col h-full w-full">
              <div className="flex-1 flex flex-col items-center justify-center px-4">
                <div className={cn(
                  "flex flex-col items-center text-center w-full space-y-8",
                  "max-w-[850px] sm:max-w-full sm:px-4"
                )}>
                  <Skeleton className="h-10 w-40 sm:h-8 sm:w-32" />
                  <Skeleton className="h-7 w-56 sm:h-6 sm:w-48" />
                  <Skeleton className="w-full h-[100px] rounded-xl sm:h-[80px]" />
                  <div className="block sm:hidden lg:block w-full">
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </BackgroundAALChecker>
  );
}