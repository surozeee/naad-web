'use client';

import { FormEvent, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useLocale } from '@/app/components/LocaleProvider';
import BirthPlaceMapPicker, {
  type BirthPlaceSelection,
} from '../../components/kundali/BirthPlaceMapPicker';
import KundaliMatchPanel from '../../components/kundali/KundaliMatchPanel';
import { DateInputWithCalendarMode } from '@/app/components/ui/DateInputWithCalendarMode';
import { BirthTimeField } from '@/app/components/ui/BirthTimeField';
import { ensureOfficialLibrary } from '@/app/components/ui/nepali-datepicker';
import { kundaliApi } from '@/app/lib/kundali.service';
import type { KundaliMatchResult } from '@/app/lib/kundali.types';
import { defaultCalendarMode, type CalendarMode } from '@/app/lib/date-bridge';

const DEFAULT_PLACE: BirthPlaceSelection = {
  placeName: 'Kathmandu, Nepal',
  latitude: 27.7172,
  longitude: 85.324,
  timezone: 'Asia/Kathmandu',
  countryCode: 'NP',
  timezoneSource: 'country',
};

type PersonForm = {
  name: string;
  birthDate: string;
  birthTime: string;
  place: BirthPlaceSelection;
};

const DEFAULT_PERSON = (date: string, time: string): PersonForm => ({
  name: '',
  birthDate: date,
  birthTime: time,
  place: { ...DEFAULT_PLACE },
});

export default function CompatibilityPage() {
  const { language } = useLocale();
  const [male, setMale] = useState<PersonForm>(() => DEFAULT_PERSON('1990-05-15', '10:30'));
  const [female, setFemale] = useState<PersonForm>(() => DEFAULT_PERSON('1992-08-20', '14:00'));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(() => defaultCalendarMode(language));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KundaliMatchResult | null>(null);

  useEffect(() => {
    setCalendarMode(defaultCalendarMode(language));
  }, [language]);

  useEffect(() => {
    void ensureOfficialLibrary();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      for (const [label, person] of [
        ['Groom', male],
        ['Bride', female],
      ] as const) {
        if (!person.birthDate) throw new Error(`${label}: date of birth is required`);
        if (!person.place.timezone.trim()) {
          throw new Error(`${label}: timezone is required — pick an active timezone`);
        }
        if (Number.isNaN(person.place.latitude) || Number.isNaN(person.place.longitude)) {
          throw new Error(`${label}: select birth place on the map`);
        }
      }

      const match = await kundaliApi.match({
        language,
        male: {
          name: male.name.trim() || undefined,
          birthDate: male.birthDate,
          birthTime: male.birthTime,
          timezone: male.place.timezone,
          latitude: male.place.latitude,
          longitude: male.place.longitude,
          placeName: male.place.placeName.trim() || undefined,
        },
        female: {
          name: female.name.trim() || undefined,
          birthDate: female.birthDate,
          birthTime: female.birthTime,
          timezone: female.place.timezone,
          latitude: female.place.latitude,
          longitude: female.place.longitude,
          placeName: female.place.placeName.trim() || undefined,
        },
      });
      setResult(match);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Failed to compute kundali match');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Kundali Matching (Guna Milan)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter date, time, and birth place for both partners. Ashtakoot scores are calculated from
            Swiss Ephemeris moon positions and nakshatras.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid xl:grid-cols-2 gap-6">
            <PersonSection
              title="Groom / Male"
              accent="indigo"
              person={male}
              onChange={setMale}
              calendarMode={calendarMode}
              onCalendarModeChange={setCalendarMode}
              dateId="match-male-dob"
            />
            <PersonSection
              title="Bride / Female"
              accent="purple"
              person={female}
              onChange={setFemale}
              calendarMode={calendarMode}
              onCalendarModeChange={setCalendarMode}
              dateId="match-female-dob"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-60"
          >
            {loading ? 'Matching kundalis…' : 'Match Kundali'}
          </button>
        </form>

        {result && <KundaliMatchPanel result={result} />}
      </div>
    </DashboardLayout>
  );
}

function PersonSection({
  title,
  accent,
  person,
  onChange,
  calendarMode,
  onCalendarModeChange,
  dateId,
}: {
  title: string;
  accent: 'indigo' | 'purple';
  person: PersonForm;
  onChange: (next: PersonForm) => void;
  calendarMode: CalendarMode;
  onCalendarModeChange: (mode: CalendarMode) => void;
  dateId: string;
}) {
  const border =
    accent === 'indigo'
      ? 'border-indigo-200 dark:border-indigo-900/50'
      : 'border-purple-200 dark:border-purple-900/50';

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border ${border} space-y-4`}
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name (optional)
        </label>
        <input
          value={person.name}
          onChange={(e) => onChange({ ...person, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          placeholder="Full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date of birth
        </label>
        <DateInputWithCalendarMode
          id={dateId}
          valueAd={person.birthDate}
          onChangeAd={(birthDate) => onChange({ ...person, birthDate })}
          calendarMode={calendarMode}
          onCalendarModeChange={onCalendarModeChange}
          togglePosition="end"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Time of birth
        </label>
        <BirthTimeField
          id={`${dateId}-time`}
          value={person.birthTime}
          onChange={(birthTime) => onChange({ ...person, birthTime })}
        />
      </div>

      <BirthPlaceMapPicker
        value={person.place}
        birthDate={person.birthDate}
        onChange={(place) => onChange({ ...person, place })}
      />
    </div>
  );
}
