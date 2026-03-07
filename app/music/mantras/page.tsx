import { redirect } from 'next/navigation';

export default function MantrasPage() {
  redirect('/music/listen?musicType=MANTRA');
}
