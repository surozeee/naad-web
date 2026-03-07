import { redirect } from 'next/navigation';

export default function BhajansPage() {
  redirect('/music/listen?musicType=BHAJAN');
}
