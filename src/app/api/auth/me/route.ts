import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword, comparePassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: {
      id: true,
      username: true,
      email: true,
      profilePictureUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

const updateProfileSchema = z.object({
  profilePictureUrl: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
});

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (validated.profilePictureUrl !== undefined) {
      updateData.profilePictureUrl = validated.profilePictureUrl;
    }

    if (validated.newPassword) {
      if (!validated.currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      const isMatch = await comparePassword(validated.currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      updateData.passwordHash = await hashPassword(validated.newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        profilePictureUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}
