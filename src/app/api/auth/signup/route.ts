/* eslint-disable import/prefer-default-export */
import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { firstName, lastName, username, email, password } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
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

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'A user with that username already exists' },
        { status: 400 },
      );
    }

    const hashed = await hash(password, 10);

    await prisma.user.create({
      data: {
        username,
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
