'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { musicApi, musicTypeApi } from '@/app/lib/crm.service';
import {
  Play,
  Pause,
  Search,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2,
  Gauge,
} from 'lucide-react';
import styles from './listen.module.css';

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

const PAGE_SIZE = 12;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const SKIP_SECONDS = 10;

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

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--';
  return formatTime(seconds);
}

function ListenPageContent() {
  const searchParams = useSearchParams();
  const [typeOptions, setTypeOptions] = useState<ActiveMusicTypeOption[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [musicTypeId, setMusicTypeId] = useState('');
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const isSeekingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const playRequestRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === playingId) ?? null,
    [tracks, playingId]
  );
  const currentIndex = useMemo(
    () => tracks.findIndex((t) => t.id === playingId),
    [tracks, playingId]
  );

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);


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
        setTypeOptions(
          list.map((row) => ({
            id: String(row.id ?? ''),
            name: String(row.name ?? row.type ?? ''),
            type: row.type != null ? String(row.type) : undefined,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setTypeOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const idParam = searchParams.get('musicTypeId');
    const typeParam = searchParams.get('musicType');
    if (idParam?.trim()) {
      setMusicTypeId(idParam.trim());
      return;
    }
    if (typeParam?.trim() && typeOptions.length > 0) {
      const found = typeOptions.find(
        (o) => (o.type || o.name).toUpperCase() === typeParam.trim().toUpperCase()
      );
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
        const total =
          (res as { totalElements?: number }).totalElements ??
          (res as { total?: number }).total ??
          list.length;
        const totalP =
          (res as { totalPages?: number }).totalPages ??
          Math.max(1, Math.ceil(total / PAGE_SIZE));
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
    return () => {
      cancelled = true;
    };
  }, [pageNo, searchKey, musicTypeId]);

  const applyRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const seekTo = useCallback((timeSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const mediaDuration =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : durationRef.current;
    if (!Number.isFinite(mediaDuration) || mediaDuration <= 0) return;

    const target = Math.min(Math.max(0, timeSeconds), Math.max(0, mediaDuration - 0.05));
    const wasPlaying = !audio.paused;

    const apply = () => {
      try {
        const fastSeek = (audio as HTMLAudioElement & { fastSeek?: (t: number) => void }).fastSeek;
        if (typeof fastSeek === 'function') fastSeek.call(audio, target);
        else audio.currentTime = target;
      } catch {
        audio.currentTime = target;
      }
      currentTimeRef.current = target;
      setCurrentTime(target);
    };

    apply();

    const onSeeked = () => {
      if (Math.abs(audio.currentTime - target) > 0.35) {
        try {
          audio.currentTime = target;
        } catch {
          /* ignore */
        }
      }
      currentTimeRef.current = audio.currentTime;
      setCurrentTime(audio.currentTime);
      if (wasPlaying && audio.paused) {
        audio.play().catch(() => {});
      }
    };
    audio.addEventListener('seeked', onSeeked, { once: true });
    window.setTimeout(() => {
      if (Math.abs(audio.currentTime - target) > 0.35) apply();
    }, 120);
  }, []);

  const streamUrlFor = useCallback((trackId: string) => `/api/bucket/public/stream/${trackId}`, []);

  const playTrack = useCallback(
    async (track: Track) => {
      if (!track.mp3Url && !track.id) return;
      const audio = audioRef.current;
      if (!audio) return;

      if (playingId === track.id) {
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
        return;
      }

      const requestId = playRequestRef.current + 1;
      playRequestRef.current = requestId;
      setBuffering(true);
      setPlayingId(track.id);
      setCurrentTime(0);
      setDuration(0);
      currentTimeRef.current = 0;
      durationRef.current = 0;

      // Same-origin Range stream (YouTube-style progressive buffer + seek)
      const playableUrl = streamUrlFor(track.id);
      if (playRequestRef.current !== requestId) return;

      audio.pause();
      audio.src = playableUrl;
      audio.preload = 'auto';
      audio.playbackRate = playbackRate;
      audio.volume = muted ? 0 : volume;
      try {
        audio.load();
      } catch {
        /* ignore */
      }

      const start = () => {
        if (playRequestRef.current !== requestId) return;
        setBuffering(false);
        audio.playbackRate = playbackRate;
        audio.play().catch(() => setBuffering(false));
      };

      if (audio.readyState >= 2) start();
      else {
        audio.addEventListener('canplay', start, { once: true });
        audio.addEventListener(
          'error',
          () => {
            if (playRequestRef.current !== requestId) return;
            // Fallback to direct mp3 URL if stream proxy unavailable
            if (track.mp3Url) {
              audio.src = track.mp3Url;
              audio.load();
              audio.play().catch(() => {});
            }
            setBuffering(false);
          },
          { once: true }
        );
      }
    },
    [muted, playbackRate, playingId, streamUrlFor, volume]
  );

  const playByOffset = useCallback(
    (offset: number) => {
      if (currentIndex < 0) return;
      const next = tracks[currentIndex + offset];
      if (next?.mp3Url) void playTrack(next);
    },
    [currentIndex, playTrack, tracks]
  );

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId) {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
      return;
    }
    const first = tracks.find((t) => t.mp3Url);
    if (first) void playTrack(first);
  };

  const skipBy = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const base = Number.isFinite(audio.currentTime) ? audio.currentTime : currentTimeRef.current;
    seekTo(base + seconds);
  };

  const onSliderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    isSeekingRef.current = true;
    const pct = Number(e.target.value);
    const d = durationRef.current;
    if (!Number.isFinite(d) || d <= 0) return;
    const time = (pct / 100) * d;
    currentTimeRef.current = time;
    setCurrentTime(time);
  };

  const commitSliderSeek = () => {
    seekTo(currentTimeRef.current);
    isSeekingRef.current = false;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      const idx = tracks.findIndex((t) => t.id === playingId);
      const next = idx >= 0 ? tracks.slice(idx + 1).find((t) => t.mp3Url) : undefined;
      if (next) {
        void playTrack(next);
        return;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setPlayingId(null);
    };
    const onTimeUpdate = () => {
      if (!isSeekingRef.current) setCurrentTime(audio.currentTime);
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) setDuration((prev) => (prev !== d ? d : prev));
    };
    const setDurationIfValid = () => {
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) setDuration(d);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', setDurationIfValid);
    audio.addEventListener('durationchange', setDurationIfValid);
    audio.addEventListener('loadeddata', setDurationIfValid);
    audio.addEventListener('canplay', setDurationIfValid);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', setDurationIfValid);
      audio.removeEventListener('durationchange', setDurationIfValid);
      audio.removeEventListener('loadeddata', setDurationIfValid);
      audio.removeEventListener('canplay', setDurationIfValid);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [playTrack, playingId, tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Listen</h1>
            <p className={styles.subtitle}>
              Professional MP3 player with slow / fast playback for mantras, bhajans, and chants.
            </p>
          </div>
        </header>

        <section className={styles.toolbar}>
          <form
            className={styles.searchForm}
            onSubmit={(e) => {
              e.preventDefault();
              setSearchKey(searchInput.trim());
              setPageNo(0);
            }}
          >
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search tracks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className={styles.btn}>
              Search
            </button>
          </form>
          <select
            className={styles.select}
            value={musicTypeId}
            onChange={(e) => {
              setMusicTypeId(e.target.value);
              setPageNo(0);
            }}
            aria-label="Music type"
          >
            <option value="">All types</option>
            {typeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </section>

        <audio ref={audioRef} className="hidden" preload="auto" />

        <section className={styles.player} aria-label="MP3 player">
          <div className={styles.playerInner}>
            <div className={styles.playerTop}>
              <div className={styles.art} aria-hidden>
                <Music2 size={28} />
              </div>
              <div className={styles.meta}>
                <p className={styles.nowLabel}>{buffering ? 'Loading audio' : 'Now playing'}</p>
                <h2 className={styles.trackTitle} title={currentTrack?.title ?? 'Select a track'}>
                  {currentTrack?.title ?? 'Select a track'}
                </h2>
                <p className={styles.trackArtist}>{currentTrack?.artist ?? '—'}</p>
              </div>
            </div>

            <div className={styles.controls}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => playByOffset(-1)}
                disabled={currentIndex <= 0}
                aria-label="Previous track"
              >
                <SkipBack size={18} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => skipBy(-SKIP_SECONDS)}
                disabled={!currentTrack}
                aria-label={`Rewind ${SKIP_SECONDS} seconds`}
                title={`-${SKIP_SECONDS}s`}
              >
                -{SKIP_SECONDS}s
              </button>
              <button
                type="button"
                className={styles.playBtn}
                onClick={togglePlayPause}
                disabled={!currentTrack && !tracks.some((t) => t.mp3Url)}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => skipBy(SKIP_SECONDS)}
                disabled={!currentTrack}
                aria-label={`Forward ${SKIP_SECONDS} seconds`}
                title={`+${SKIP_SECONDS}s`}
              >
                +{SKIP_SECONDS}s
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => playByOffset(1)}
                disabled={currentIndex < 0 || currentIndex >= tracks.length - 1}
                aria-label="Next track"
              >
                <SkipForward size={18} />
              </button>
            </div>

            <div className={styles.progressRow}>
              <span className={styles.time}>{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                disabled={!currentTrack || buffering}
                onChange={onSliderInput}
                onInput={onSliderInput}
                onMouseDown={() => {
                  isSeekingRef.current = true;
                }}
                onMouseUp={commitSliderSeek}
                onTouchStart={() => {
                  isSeekingRef.current = true;
                }}
                onTouchEnd={commitSliderSeek}
                onKeyUp={commitSliderSeek}
                className={styles.slider}
                style={{
                  background: `linear-gradient(to right, var(--naad-primary) 0%, var(--naad-primary) ${progress}%, var(--naad-line) ${progress}%, var(--naad-line) 100%)`,
                }}
                aria-label="Seek"
              />
              <span className={`${styles.time} ${styles.timeEnd}`}>{formatDuration(duration)}</span>
            </div>

            <div className={styles.bottomRow}>
              <div className={styles.speedGroup} role="group" aria-label="Playback speed">
                <span className={styles.speedLabel}>
                  <Gauge size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Speed
                </span>
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={`${styles.speedBtn} ${playbackRate === rate ? styles.speedBtnActive : ''}`.trim()}
                    onClick={() => applyRate(rate)}
                    aria-pressed={playbackRate === rate}
                    title={rate < 1 ? 'Slower' : rate > 1 ? 'Faster' : 'Normal'}
                  >
                    {rate === 1 ? '1x' : `${rate}x`}
                  </button>
                ))}
              </div>

              <div className={styles.volumeGroup}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'}
                >
                  {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setVolume(next);
                    setMuted(next === 0);
                  }}
                  className={`${styles.slider} ${styles.volumeSlider}`}
                  style={{
                    background: `linear-gradient(to right, var(--naad-primary) 0%, var(--naad-primary) ${(muted ? 0 : volume) * 100}%, var(--naad-line) ${(muted ? 0 : volume) * 100}%, var(--naad-line) 100%)`,
                  }}
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        </section>

        {error ? <div className={styles.error}>{error}</div> : null}

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {tracks.map((track) => {
                const isActive = playingId === track.id;
                return (
                  <article
                    key={track.id}
                    className={`${styles.card} ${isActive ? styles.cardActive : ''}`.trim()}
                  >
                    <div className={styles.cardArt}>
                      <Music2 size={28} />
                    </div>
                    <h3 className={styles.cardTitle}>{track.title}</h3>
                    <p className={styles.cardArtist}>{track.artist}</p>
                    {track.mp3Url ? (
                      <button
                        type="button"
                        className={`${styles.cardPlay} ${isActive && isPlaying ? styles.cardPlayActive : ''}`.trim()}
                        onClick={() => void playTrack(track)}
                      >
                        {isActive && isPlaying ? 'Pause' : isActive ? 'Resume' : 'Play'}
                      </button>
                    ) : (
                      <span className={`${styles.cardPlay} ${styles.cardDisabled}`}>No audio</span>
                    )}
                  </article>
                );
              })}
            </div>

            {totalPages > 1 ? (
              <div className={styles.pager}>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  onClick={() => setPageNo((p) => Math.max(0, p - 1))}
                  disabled={pageNo === 0}
                >
                  Previous
                </button>
                <span className={styles.pagerInfo}>
                  Page {pageNo + 1} of {totalPages} ({totalElements} tracks)
                </span>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  onClick={() => setPageNo((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageNo >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}

        {!loading && !error && tracks.length === 0 ? (
          <p className={styles.empty}>No tracks found. Try a different search or type.</p>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default function ListenPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className={styles.loadingNote}>Loading player...</div>
        </DashboardLayout>
      }
    >
      <ListenPageContent />
    </Suspense>
  );
}
