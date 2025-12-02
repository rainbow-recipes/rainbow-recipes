import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// eslint-disable-next-line import/prefer-default-export
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const { firstName, lastName, image } = await req.json();

    // Optional: build a full name for the generic `name` column
    const fullName = [firstName, lastName].filter((p) => p && p.trim().length > 0).join(' ')
      || null;

    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        image: image ?? null,
        name: fullName, // keep the core `name` field in sync
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        role: true,
        isMerchant: true,
        merchantApproved: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
