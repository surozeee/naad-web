export default function AstrologyPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Astrology
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
          Explore the cosmic influences and planetary positions that shape your destiny.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Birth Chart</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Discover your personalized birth chart based on your exact time, date, and place of birth.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Planetary Positions</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Understand how planets influence different aspects of your life.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
