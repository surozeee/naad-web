import DashboardLayout from '../../components/DashboardLayout';

export default function SpecialPujaPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Special Puja
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Book special puja ceremonies for important occasions
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Wedding Puja', description: 'Blessings for marriage', icon: '💒' },
            { name: 'House Warming', description: 'Griha Pravesh ceremony', icon: '🏠' },
            { name: 'Birthday Puja', description: 'Birthday blessings', icon: '🎂' },
            { name: 'Business Puja', description: 'Business inauguration', icon: '💼' },
            { name: 'Health Puja', description: 'Prayers for good health', icon: '🏥' },
            { name: 'Education Puja', description: 'Academic success', icon: '📚' },
          ].map((puja) => (
            <div key={puja.name} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="text-5xl mb-4 text-center">{puja.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">
                {puja.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
                {puja.description}
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Book Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

