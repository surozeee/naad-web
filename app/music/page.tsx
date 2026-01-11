export default function MusicPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Spiritual Music
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
          Immerse yourself in devotional music, mantras, and chants for spiritual upliftment.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Devotional Music</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Listen to soulful devotional songs that bring peace and tranquility.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Mantras</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Chant powerful mantras for meditation and spiritual growth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
