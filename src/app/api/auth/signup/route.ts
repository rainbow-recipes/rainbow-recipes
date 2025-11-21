/* eslint-disable import/prefer-default-export */
import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email, and password are required' },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'A user with that email already exists' },
        { status: 400 },
      );
    }

    const hashed = await hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName: firstName || null,
        lastName: lastName || null,
        name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || null,
        role: Role.USER,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: 'Failed to sign up' },
      { status: 500 },
    );
  }
}
