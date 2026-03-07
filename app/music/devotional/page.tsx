import { redirect } from 'next/navigation';

export default function DevotionalMusicPage() {
  redirect('/music/listen?musicType=DEVOTIONAL');
}
