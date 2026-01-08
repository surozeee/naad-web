'use client';

import { useState } from 'react';

const palmLines = [
  {
    name: 'Life Line',
    description: 'Represents vitality, physical health, and major life changes',
    position: 'Curves around the thumb',
    meanings: [
      'A long, deep line suggests vitality and strength',
      'A short line may indicate caution in health matters',
      'Breaks in the line can signify major life changes',
      'A forked end suggests adaptability and travel',
    ],
  },
  {
    name: 'Heart Line',
    description: 'Reveals emotional nature, relationships, and matters of the heart',
    position: 'Runs horizontally across the top of the palm',
    meanings: [
      'A long line reaching the edge suggests emotional openness',
      'A straight line indicates practicality in love',
      'A curved line shows romantic and expressive nature',
      'Multiple branches suggest many meaningful relationships',
    ],
  },
  {
    name: 'Head Line',
    description: 'Indicates intellectual capacity, thinking style, and mental approach',
    position: 'Runs horizontally across the middle of the palm',
    meanings: [
      'A long line suggests analytical thinking',
      'A short line indicates quick, decisive thinking',
      'A curved line shows creativity and imagination',
      'A straight line indicates logical, practical thinking',
    ],
  },
  {
    name: 'Fate Line',
    description: 'Shows career path, life direction, and external influences',
    position: 'Runs vertically up the center of the palm',
    meanings: [
      'A deep, clear line suggests a strong sense of purpose',
      'A faint line may indicate flexibility in career',
      'Breaks suggest changes in life direction',
      'Starting from the wrist indicates early career focus',
    ],
  },
];

const palmMounts = [
  {
    name: 'Mount of Venus',
    location: 'Base of thumb',
    traits: 'Love, passion, sensuality, and physical energy',
    symbol: '💖',
  },
  {
    name: 'Mount of Jupiter',
    location: 'Below index finger',
    traits: 'Ambition, leadership, and spiritual growth',
    symbol: '👑',
  },
  {
    name: 'Mount of Saturn',
    location: 'Below middle finger',
    traits: 'Wisdom, responsibility, and introspection',
    symbol: '🔮',
  },
  {
    name: 'Mount of Apollo',
    location: 'Below ring finger',
    traits: 'Creativity, artistic talent, and success',
    symbol: '✨',
  },
  {
    name: 'Mount of Mercury',
    location: 'Below little finger',
    traits: 'Communication, business acumen, and wit',
    symbol: '💬',
  },
  {
    name: 'Mount of Moon',
    location: 'Opposite thumb, near wrist',
    traits: 'Intuition, imagination, and emotional depth',
    symbol: '🌙',
  },
];

export default function PalmistryPage() {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedHand, setSelectedHand] = useState<'left' | 'right'>('right');
  const [showReading, setShowReading] = useState(false);

  const generateReading = () => {
    const randomLines = palmLines.sort(() => 0.5 - Math.random()).slice(0, 2);
    const randomMounts = palmMounts.sort(() => 0.5 - Math.random()).slice(0, 2);
    
    return {
      lines: randomLines,
      mounts: randomMounts,
      overall: [
        'Your palm reveals a balanced personality with strong intuitive abilities.',
        'You possess natural leadership qualities and creative talents.',
        'Your life path shows adaptability and resilience.',
        'Relationships play a significant role in your personal growth.',
        'You have the potential for great success through hard work and determination.',
      ][Math.floor(Math.random() * 5)],
    };
  };

  const [reading, setReading] = useState<ReturnType<typeof generateReading> | null>(null);

  const handleGetReading = () => {
    setReading(generateReading());
    setShowReading(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Palmistry Reading
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Discover the secrets hidden in your palm lines and mounts
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              Palm Lines Guide
            </h2>
            <div className="space-y-4">
              {palmLines.map((line) => (
                <button
                  key={line.name}
                  onClick={() => setSelectedLine(selectedLine === line.name ? null : line.name)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedLine === line.name
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="font-bold text-lg mb-1">{line.name}</div>
                  <div className={`text-sm mb-2 ${selectedLine === line.name ? 'text-pink-100' : 'text-gray-600 dark:text-gray-300'}`}>
                    {line.description}
                  </div>
                  {selectedLine === line.name && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-semibold mb-2">Position: {line.position}</div>
                      <div className="text-sm font-semibold mb-2">Meanings:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-pink-50">
                        {line.meanings.map((meaning, idx) => (
                          <li key={idx}>{meaning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              Palm Mounts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {palmMounts.map((mount) => (
                <div
                  key={mount.name}
                  className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg border border-pink-200 dark:border-pink-800"
                >
                  <div className="text-3xl mb-2">{mount.symbol}</div>
                  <div className="font-bold text-gray-800 dark:text-white mb-1">
                    {mount.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {mount.location}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    {mount.traits}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🖐️</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                Get Your Palm Reading
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Select which hand you'd like to read, then get your personalized palmistry reading
              </p>
              
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => setSelectedHand('left')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedHand === 'left'
                      ? 'bg-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Left Hand
                </button>
                <button
                  onClick={() => setSelectedHand('right')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedHand === 'right'
                      ? 'bg-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Right Hand
                </button>
              </div>

              <button
                onClick={handleGetReading}
                className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Get My Palm Reading
              </button>
            </div>
          </div>
        </div>

        {showReading && reading && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-pink-100 dark:border-pink-900">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
                  Your {selectedHand.charAt(0).toUpperCase() + selectedHand.slice(1)} Hand Reading
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Based on palmistry analysis
                </p>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Overall Reading</h3>
                <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                  {reading.overall}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Prominent Lines</h3>
                <div className="space-y-4">
                  {reading.lines.map((line, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
                        {line.name}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">{line.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {line.meanings[Math.floor(Math.random() * line.meanings.length)]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Active Mounts</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {reading.mounts.map((mount, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
                      <div className="text-2xl mb-2">{mount.symbol}</div>
                      <div className="font-bold text-gray-800 dark:text-white mb-1">
                        {mount.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {mount.traits}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

