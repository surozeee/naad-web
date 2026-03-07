'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { musicApi } from '@/app/lib/crm.service';

interface Track {
  id: string;
  title: string;
  artist: string;
  mp3Url: string;
}

function mapToTrack(raw: Record<string, unknown>): Track {
  const musicType = raw.musicType as Record<string, unknown> | undefined;
  const typeName = musicType?.type ? String(musicType.type) : '';
  return {
    id: String(raw.id ?? ''),
    title: String(raw.name ?? ''),
    artist: typeName || 'Mantra',
    mp3Url: String(raw.mp3Url ?? ''),
  };
}

export default function MantrasPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    musicApi
      .list({
        pageNo: 0,
        pageSize: 10,
        sortBy: 'name',
        sortDirection: 'asc',
        searchKey: '',
        musicType: 'MANTRA',
      })
      .then((res) => {
        if (cancelled) return;
        const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
        setTracks(list.map(mapToTrack));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
        setTracks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Mantras
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Chant powerful mantras for spiritual growth and inner peace
          </p>
        </div>

        {error && (
          <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-slate-600 rounded mb-4" />
                <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded mb-2 w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded mb-4 w-1/2 mx-auto" />
                <div className="h-10 bg-gray-200 dark:bg-slate-600 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <div key={track.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="text-5xl mb-4 text-center">🕉️</div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 text-center">
                  {track.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
                  {track.artist}
                </p>
                {track.mp3Url ? (
                  <a
                    href={track.mp3Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-center"
                  >
                    Play
                  </a>
                ) : (
                  <span className="block w-full px-4 py-2 bg-gray-400 dark:bg-slate-600 text-white rounded-lg font-semibold text-center cursor-not-allowed">
                    No audio
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && tracks.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No mantras found.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
