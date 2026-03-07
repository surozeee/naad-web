'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { musicApi, musicTypeApi } from '@/app/lib/crm.service';
import { Play, Pause, Search, Info } from 'lucide-react';

/** Active music type option: id for API, name for display, type for URL param matching */
interface ActiveMusicTypeOption {
  id: string;
  name: string;
  type?: string;
}

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
    artist: typeName || 'Music',
    mp3Url: String(raw.mp3Url ?? ''),
  };
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Show duration as --:-- when unknown */
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--';
  return formatTime(seconds);
}

const PAGE_SIZE = 12;

function ListenPageContent() {
  const searchParams = useSearchParams();
  const [typeOptions, setTypeOptions] = useState<ActiveMusicTypeOption[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [musicTypeId, setMusicTypeId] = useState<string>('');
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isSeekingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = tracks.find((t) => t.id === playingId) ?? null;

  // Fetch active music types only
  useEffect(() => {
    let cancelled = false;
    musicTypeApi
      .list({
        pageNo: 0,
        pageSize: 100,
        sortBy: 'name',
        sortDirection: 'asc',
        status: 'ACTIVE',
      })
      .then((res) => {
        if (cancelled) return;
        const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
        const options: ActiveMusicTypeOption[] = list.map((row) => ({
          id: String(row.id ?? ''),
          name: String(row.name ?? row.type ?? ''),
          type: row.type != null ? String(row.type) : undefined,
        }));
        setTypeOptions(options);
      })
      .catch(() => {
        if (!cancelled) setTypeOptions([]);
      });
    return () => { cancelled = true; };
  }, []);

  // Initialize musicTypeId from URL: ?musicTypeId=xxx or ?musicType=MANTRA (resolve to id when options loaded)
  useEffect(() => {
    const idParam = searchParams.get('musicTypeId');
    const typeParam = searchParams.get('musicType');
    if (idParam && idParam.trim()) {
      setMusicTypeId(idParam.trim());
      return;
    }
    if (typeParam && typeParam.trim() && typeOptions.length > 0) {
      const found = typeOptions.find((o) => (o.type || o.name).toUpperCase() === typeParam.trim().toUpperCase());
      if (found) setMusicTypeId(found.id);
    }
  }, [searchParams, typeOptions]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    musicApi
      .list({
        pageNo,
        pageSize: PAGE_SIZE,
        sortBy: 'name',
        sortDirection: 'asc',
        searchKey: searchKey.trim() || undefined,
        musicTypeId: musicTypeId || undefined,
      })
      .then((res) => {
        if (cancelled) return;
        const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
        const total = (res as { totalElements?: number }).totalElements ?? (res as { total?: number }).total ?? list.length;
        const totalP = (res as { totalPages?: number }).totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
        setTracks(list.map(mapToTrack));
        setTotalElements(total);
        setTotalPages(totalP);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
        setTracks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [pageNo, searchKey, musicTypeId]);

  const handlePlay = (track: Track) => {
    if (!track.mp3Url) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
      setIsPlaying(false);
      return;
    }
    audio.src = track.mp3Url;
    setCurrentTime(0);
    setDuration(0);
    audio.play().catch(() => {});
    setPlayingId(track.id);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId) {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    } else if (currentTrack?.mp3Url) {
      handlePlay(currentTrack);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value);
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration <= 0) return;
    const time = (pct / 100) * duration;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleSliderMouseDown = () => { isSeekingRef.current = true; };
  const handleSliderMouseUp = () => { isSeekingRef.current = false; };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      setPlayingId(null);
      setIsPlaying(false);
    };
    const onTimeUpdate = () => {
      if (!isSeekingRef.current) setCurrentTime(audio.currentTime);
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) setDuration((prev) => (prev !== d ? d : prev));
    };
    const setDurationIfValid = (d: number) => {
      if (Number.isFinite(d) && d > 0) setDuration(d);
    };
    const onLoadedMetadata = () => setDurationIfValid(audio.duration);
    const onDurationChange = () => setDurationIfValid(audio.duration);
    const onLoadedData = () => setDurationIfValid(audio.duration);
    const onCanPlay = () => setDurationIfValid(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('loadeddata', onLoadedData);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('loadeddata', onLoadedData);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  // Poll for duration when playing and duration unknown (some streams set it late)
  useEffect(() => {
    if (!currentTrack?.mp3Url || !isPlaying || (Number.isFinite(duration) && duration > 0)) return;
    const audio = audioRef.current;
    if (!audio) return;
    const interval = setInterval(() => {
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) {
        setDuration(d);
        return;
      }
    }, 400);
    const stop = setTimeout(() => clearInterval(interval), 8000);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [currentTrack?.mp3Url, isPlaying, duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKey(searchInput.trim());
    setPageNo(0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="border-b border-gray-200 dark:border-slate-700 pb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Music
            </h1>
            <div
              className="page-header-info-wrap"
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button type="button" aria-label="Page information" className="page-header-info-btn dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                <Info size={18} />
              </button>
              {showInfoTooltip && (
                <div className="page-header-info-tooltip dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                  <div className="page-header-info-tooltip-arrow dark:bg-slate-700 dark:border-slate-600" />
                  Listen to devotional music, mantras, bhajans, and chants
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Search + filter toolbar */}
        <section className="rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-800/50 p-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-stretch sm:items-center">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search tracks..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition shadow-sm"
              >
                Search
              </button>
            </form>
            <div className="flex items-center gap-2">
              <label htmlFor="music-type-filter" className="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">
                Type
              </label>
              <select
                id="music-type-filter"
                value={musicTypeId}
                onChange={(e) => { setMusicTypeId(e.target.value); setPageNo(0); }}
                className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white px-3 py-2.5 min-w-[160px] focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="">All types</option>
                {typeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <audio ref={audioRef} className="hidden" preload="metadata" />

        {/* Now playing bar */}
        {currentTrack && (
          <div className="sticky top-0 z-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-md shadow-gray-200/60 dark:shadow-none">
            <div className="flex items-center gap-4 px-4 py-3">
              <button
                type="button"
                onClick={togglePlayPause}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white shadow-md transition hover:bg-purple-700 active:scale-95 disabled:opacity-50"
                disabled={!currentTrack?.mp3Url}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex shrink-0 items-baseline gap-1 text-sm font-medium tabular-nums text-gray-600 dark:text-gray-300">
                    <span className="text-gray-900 dark:text-white">{formatTime(currentTime)}</span>
                    <span className="text-gray-400 dark:text-gray-500">/</span>
                    <span className={duration > 0 ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>{formatDuration(duration)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={progress}
                    onChange={handleSeek}
                    onMouseDown={handleSliderMouseDown}
                    onMouseUp={handleSliderMouseUp}
                    onMouseLeave={handleSliderMouseUp}
                    onTouchStart={handleSliderMouseDown}
                    onTouchEnd={handleSliderMouseUp}
                    className="mantra-slider h-2 flex-1 min-w-0 cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${progress}%, rgb(226 232 240) ${progress}%, rgb(226 232 240) 100%)`,
                    }}
                  />
                </div>
                <div className="min-w-0 shrink">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Now playing</p>
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={currentTrack.title}>
                    {currentTrack.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-slate-600 rounded mb-4" />
                <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded mb-2 w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded mb-4 w-1/2 mx-auto" />
                <div className="h-10 bg-gray-200 dark:bg-slate-600 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tracks.map((track) => {
                const isActive = playingId === track.id;
                return (
                  <div
                    key={track.id}
                    className={`rounded-xl border p-6 transition-shadow hover:shadow-lg ${
                      isActive
                        ? 'border-purple-300 dark:border-purple-600 bg-purple-50/30 dark:bg-purple-900/20 shadow-md'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="text-4xl mb-4 text-center text-purple-600 dark:text-purple-400">🕉️</div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 text-center line-clamp-2">
                      {track.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">
                      {track.artist}
                    </p>
                    {track.mp3Url ? (
                      <button
                        type="button"
                        onClick={() => handlePlay(track)}
                        className={`block w-full px-4 py-2.5 rounded-lg transition-all font-semibold text-sm ${
                          isActive
                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                        }`}
                      >
                        {isActive ? 'Pause' : 'Play'}
                      </button>
                    ) : (
                      <span className="block w-full px-4 py-2.5 bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400 rounded-lg font-semibold text-sm text-center cursor-not-allowed">
                        No audio
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setPageNo((p) => Math.max(0, p - 1))}
                  disabled={pageNo === 0}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                  Page {pageNo + 1} of {totalPages} ({totalElements} tracks)
                </span>
                <button
                  type="button"
                  onClick={() => setPageNo((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageNo >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !error && tracks.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No tracks found. Try a different search or type.</p>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ListenPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[200px] text-slate-500 dark:text-slate-400">
            Loading...
          </div>
        </DashboardLayout>
      }
    >
      <ListenPageContent />
    </Suspense>
  );
}
