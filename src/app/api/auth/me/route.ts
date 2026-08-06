import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: {
      id: true,
      username: true,
      email: true,
      phoneNumber: true,
      profilePictureUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: dbUser });
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber.trim() !== '') {
      const trimmed = phoneNumber.trim();
      if (!/^\d+$/.test(trimmed)) {
        return NextResponse.json(
          { error: 'Phone number must contain digits only (0–9).' },
          { status: 400 }
        );
      }
      if (trimmed.length < 10 || trimmed.length > 15) {
        return NextResponse.json(
          { error: 'Phone number must be between 10 and 15 digits long.' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        profilePictureUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
