import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LandingPage from '@/components/LandingPage';

export default async function Home() {
  const session = await getServerSession(authOptions);

  let role: string;
  let userName: string;

  if (!session || !session.user) {
    role = 'guest';
    userName = 'Guest';
  } else {
    role = 'user';
    userName = session.user.name || 'User';
  }

  return <LandingPage role={role} userName={userName} />;
}
