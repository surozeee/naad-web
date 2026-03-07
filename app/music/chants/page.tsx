import { redirect } from 'next/navigation';

export default function ChantsPage() {
  redirect('/music/listen?musicType=KIRTAN');
}
