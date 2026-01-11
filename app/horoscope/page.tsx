'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

const zodiacSigns = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire' },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20', element: 'Earth' },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20', element: 'Air' },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22', element: 'Water' },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire' },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth' },
  { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22', element: 'Air' },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21', element: 'Water' },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire' },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth' },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18', element: 'Air' },
  { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'Water' },
];

const predictions = {
  daily: [
    "Today brings new opportunities for growth and self-discovery. Trust your intuition and embrace change.",
    "A surprise encounter may change your perspective. Stay open to new ideas and connections.",
    "Focus on your goals today. Your determination will lead to significant progress.",
    "Take time for self-reflection. Inner peace will guide you to the right decisions.",
    "Creative energy flows strongly today. Express yourself and share your talents.",
  ],
  weekly: [
    "This week marks a turning point in your personal journey. Important decisions await.",
    "Relationships take center stage. Communication and understanding will strengthen bonds.",
    "Financial matters require attention. Careful planning will bring stability.",
    "Your career path shows promising signs. Networking and collaboration are key.",
    "Health and wellness should be prioritized. Balance work with rest and self-care.",
  ],
  monthly: [
    "This month brings transformation and renewal. Embrace new beginnings with confidence.",
    "Your social circle expands, bringing valuable connections and opportunities.",
    "Professional growth accelerates. Your hard work begins to pay off significantly.",
    "Love and relationships flourish. Deep connections form and strengthen.",
    "Spiritual growth deepens. You gain clarity about your life's purpose.",
  ],
};

export default function HoroscopePage() {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const getRandomPrediction = (period: 'daily' | 'weekly' | 'monthly') => {
    const periodPredictions = predictions[period];
    return periodPredictions[Math.floor(Math.random() * periodPredictions.length)];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Horoscope Readings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select your zodiac sign to discover what the stars have in store
          </p>
        </div>

        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={() => setSelectedPeriod('daily')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedPeriod === 'daily'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-700'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setSelectedPeriod('weekly')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedPeriod === 'weekly'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-700'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedPeriod === 'monthly'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-700'
            }`}
          >
            Monthly
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {zodiacSigns.map((sign) => (
            <button
              key={sign.name}
              onClick={() => setSelectedSign(sign.name)}
              className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
                selectedSign === sign.name
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="text-4xl mb-2">{sign.symbol}</div>
              <div className="font-bold text-lg mb-1">{sign.name}</div>
              <div className={`text-sm ${selectedSign === sign.name ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {sign.dates}
              </div>
              <div className={`text-xs mt-1 ${selectedSign === sign.name ? 'text-purple-200' : 'text-gray-400 dark:text-gray-500'}`}>
                {sign.element}
              </div>
            </button>
          ))}
        </div>

        {selectedSign && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-purple-100 dark:border-purple-900">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">
                  {zodiacSigns.find(s => s.name === selectedSign)?.symbol}
                </div>
                <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
                  {selectedSign} {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Horoscope
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {zodiacSigns.find(s => s.name === selectedSign)?.dates}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-6 mb-6">
                <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                  {getRandomPrediction(selectedPeriod)}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <div className="text-2xl mb-2">💫</div>
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Lucky Number</div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.floor(Math.random() * 9) + 1}
                  </div>
                </div>
                <div className="p-4 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Lucky Color</div>
                  <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
                    {['Purple', 'Pink', 'Indigo', 'Gold', 'Silver'][Math.floor(Math.random() * 5)]}
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <div className="text-2xl mb-2">⭐</div>
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Compatibility</div>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)].name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedSign && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <p className="text-xl">Select a zodiac sign above to see your {selectedPeriod} horoscope</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
