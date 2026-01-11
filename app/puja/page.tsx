export default function PujaPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Puja Services
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
          Connect with the divine through traditional puja ceremonies and rituals.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Daily Puja</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Perform daily puja rituals to seek blessings and maintain spiritual harmony.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Festival Puja</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Celebrate festivals with special puja ceremonies and traditional rituals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
