import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSession } from '@/lib/aws/dynamodb';
import { uploadImage } from '@/lib/aws/s3';
import { sessionSchema } from '@/lib/utils/validation';
import { CreateSessionRequest, CreateSessionResponse } from '@/types/session';

export async function POST(req: NextRequest) {
  try {
    const body: CreateSessionRequest = await req.json();

    // Validate input
    const validationResult = sessionSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return NextResponse.json({ error: validationResult.error.errors[0].message }, { status: 400 });
    }

    const sessionId = uuidv4();
    const { email, images } = body;

    console.log('[API] Creating session for:', email);

    try {
      // Create session in DynamoDB
      console.log('[DynamoDB] Attempting to create session:', sessionId);
      await createSession(sessionId, email);
      console.log('[DynamoDB] Session created successfully');

      // Upload images to S3
      console.log('[S3] Attempting to upload', images.length, 'images');
      const uploadPromises = images.map((base64, index) =>
        uploadImage(sessionId, index, base64)
      );
      await Promise.all(uploadPromises);
      console.log('[S3] All images uploaded successfully');

      const response: CreateSessionResponse = { sessionId };
      console.log('[API] Session creation complete');
      return NextResponse.json(response);

    } catch (awsError: any) {
      console.error('[AWS Error] Failed during session setup:', awsError);

      // If we're in DEV_MODE, we might want to continue even if AWS fails
      if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
        console.warn('[DEV_MODE] Continuing despite AWS error');
        return NextResponse.json({ sessionId });
      }

      throw awsError; // Re-throw to be caught by the outer catch
    }

  } catch (error: any) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
