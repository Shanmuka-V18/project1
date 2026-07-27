import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createSessionToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validated.email }, { username: validated.username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(validated.password);
    const newUser = await prisma.user.create({
      data: {
        username: validated.username,
        email: validated.email,
        passwordHash,
      },
    });

    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });

    setAuthCookie(token);

    return NextResponse.json({
      message: 'Signup successful',
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 });
  }
}
