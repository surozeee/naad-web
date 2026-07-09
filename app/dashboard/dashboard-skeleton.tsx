import DashboardLayout from '@/app/components/DashboardLayout';

export default function DashboardSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded-xl" />
      </div>
    </DashboardLayout>
  );
}
