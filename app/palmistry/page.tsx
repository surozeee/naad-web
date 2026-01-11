'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

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

export default function PalmistryPage() {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Palmistry
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover what your palm lines reveal about your life, relationships, and destiny
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <a href="/palmistry/reading" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🖐️</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Palm Reading</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Full palm analysis
            </p>
          </a>

          <a href="/palmistry/life-lines" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">📏</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Life Lines</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Health & vitality
            </p>
          </a>

          <a href="/palmistry/heart-lines" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Heart Lines</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Love & emotions
            </p>
          </a>

          <a href="/palmistry/head-lines" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Head Lines</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Intellect & thinking
            </p>
          </a>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Palm Lines Guide
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {palmLines.map((line) => (
              <div
                key={line.name}
                className={`bg-gray-50 dark:bg-slate-700 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedLine === line.name ? 'ring-2 ring-purple-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedLine(selectedLine === line.name ? null : line.name)}
              >
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {line.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {line.description}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mb-3">
                  Position: {line.position}
                </p>
                {selectedLine === line.name && (
                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-slate-600">
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm">
                      Meanings:
                    </h4>
                    <ul className="space-y-1">
                      {line.meanings.map((meaning, idx) => (
                        <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                          • {meaning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
