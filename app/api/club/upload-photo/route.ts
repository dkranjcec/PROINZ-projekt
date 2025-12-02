import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { uploadToS3 } from '@/lib/s3'

// AI korišten za pomoć pri uploadanju slike

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    
    if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_S3_ACCESS_KEY || !process.env.AWS_S3_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'S3 is not configured. Please set AWS_S3_BUCKET_NAME, AWS_S3_ACCESS_KEY, and AWS_S3_SECRET_ACCESS_KEY in your environment variables.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const photoUrl = await uploadToS3(
      buffer,
      file.name,
      file.type,
      userId
    )

    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload photo' },
      { status: 500 }
    )
  }
}
