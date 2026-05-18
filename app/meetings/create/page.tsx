import { redirect } from 'next/navigation';

export default function CreateMeetingRedirectPage() {
  redirect('/meetings');
}
