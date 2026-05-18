import { redirect } from 'next/navigation';

/** Legacy route – redirects to Astrologer management page. */
export default function AstrologerCreateRedirectPage() {
  redirect('/user-management/astrologer');
}
