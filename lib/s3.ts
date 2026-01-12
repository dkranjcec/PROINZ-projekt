import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  userId: string
): Promise<string> {
  // Create a unique file path: clubs/{userId}/{timestamp}-{filename}
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `clubs/${userId}/${timestamp}-${sanitizedFileName}`

  const region = process.env.AWS_S3_REGION || 'us-east-1'
  
  // Always try to set ACL to public-read first (since user enabled ACL)
  let command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
  })

  try {
    await s3Client.send(command)
    console.log(`Successfully uploaded with ACL: ${key}`)
  } catch (error: unknown) {
    // If ACL fails, try without ACL (bucket might have ACL disabled)
    if ((error as { name?: string }).name === 'AccessControlListNotSupported' || 
        (error as { code?: string }).code === 'AccessControlListNotSupported' ||
        (error as { name?: string }).name === 'InvalidArgument' ||
        (error as { message?: string }).message?.includes('ACL')) {
      console.log(`ACL not supported, uploading without ACL: ${key}`)
      command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
      await s3Client.send(command)
    } else {
      console.error('Upload error:', error)
      throw error
    }
  }

  // Return the public URL
  // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
  // Or use CloudFront URL if configured: process.env.AWS_S3_CLOUDFRONT_URL
  const cloudFrontUrl = process.env.AWS_S3_CLOUDFRONT_URL
  if (cloudFrontUrl) {
    return `${cloudFrontUrl}/${key}`
  }
  
  const publicUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
  console.log(`Generated URL: ${publicUrl}`)
  return publicUrl
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(photoUrl: string): Promise<void> {
  try {
    const url = new URL(photoUrl)
    let key = url.pathname.substring(1) // Remove leading '/'
    
    // If using CloudFront, the key is just the pathname
    // If using direct S3 URL, extract the key (everything after bucket name)
    if (photoUrl.includes('amazonaws.com')) {
      // S3 URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
      // Key is everything after the domain
      key = url.pathname.substring(1)
    } else if (process.env.AWS_S3_CLOUDFRONT_URL && photoUrl.startsWith(process.env.AWS_S3_CLOUDFRONT_URL)) {
      // CloudFront URL format: https://{cloudfront-domain}/{key}
      key = url.pathname.substring(1)
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('Error deleting from S3:', error)
    // Don't throw - allow deletion to continue even if S3 delete fails
  }
}

