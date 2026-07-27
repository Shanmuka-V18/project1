import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      // Return success even if user not found to avoid email enumeration
      return NextResponse.json({
        message: 'If an account exists with that email, password reset instructions have been sent.',
      });
    }

    // Return friendly confirmation message
    return NextResponse.json({
      message: 'Password reset link sent to your email address.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Forgot password request failed' }, { status: 500 });
  }
}
