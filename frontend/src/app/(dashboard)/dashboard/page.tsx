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
        {/* Dark background with purple light spots - matching landing page */}
        <div className="fixed inset-0 -z-10">
          {/* Light mode gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:hidden" />
          
          {/* Dark mode - matching landing page */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] hidden dark:block" />
          
          {/* Light mode spots */}
          <div className="dark:hidden">
            <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />
            <div className="absolute bottom-40 right-40 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-100/20 rounded-full blur-3xl" />
          </div>
          
          {/* Dark mode purple/violet light spots - matching landing page */}
          <div className="hidden dark:block">
            {/* Top left purple glow */}
            <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
            
            {/* Center right purple glow */}
            <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px]" />
            
            {/* Bottom center purple glow */}
            <div className="absolute bottom-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[400px] bg-purple-700/10 rounded-full blur-[120px]" />
            
            {/* Small accent glows */}
            <div className="absolute top-[60%] left-[20%] w-[200px] h-[200px] bg-violet-500/10 rounded-full blur-[80px]" />
            <div className="absolute top-[25%] right-[30%] w-[250px] h-[250px] bg-purple-500/8 rounded-full blur-[90px]" />
          </div>
          
          {/* Very subtle mesh gradient overlay */}
          <div className="absolute inset-0 hidden dark:block" 
            style={{
              background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.05), transparent)`,
            }} 
          />
          
          {/* Noise texture for depth */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '256px 256px'
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