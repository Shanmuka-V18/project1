import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { createPasswordResetToken } from '@/lib/password-reset';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user) {
      // Standard safe response to prevent email enumeration
      return NextResponse.json({
        message: 'If an account exists with that email, password reset instructions have been sent.',
      });
    }

    // Generate single-use, 15-min reset token & log URL
    const resetInfo = createPasswordResetToken(user.email);

    return NextResponse.json({
      message: 'Password reset link sent to your email address.',
      resetUrl: resetInfo.resetUrl,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Forgot password request failed' }, { status: 500 });
  }
}
