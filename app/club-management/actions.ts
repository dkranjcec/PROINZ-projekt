'use server'

import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'

// Photos actions
export async function addPhoto(userId: string, photoLink: string) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  const [user] = await sql`SELECT * FROM users WHERE userid = ${userId}`
  if (!user || user.role !== 'club') {
    throw new Error('User is not a club')
  }
  
  try {
    await sql`
      INSERT INTO clubphoto (userid, photolink)
      VALUES (${userId}, ${photoLink})
    `
  } catch (error) {
    console.error('Error adding photo:', error)
    throw new Error('Failed to add photo')
  }
}

export async function deletePhoto(userId: string, photoLink: string) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  try {
    // Delete from database first
    await sql`
      DELETE FROM clubphoto
      WHERE userid = ${userId} AND photolink = ${photoLink}
    `
    
    // If it's an S3 URL, also delete from S3
    if (photoLink.startsWith('https://') && photoLink.includes('amazonaws.com')) {
      const { deleteFromS3 } = await import('@/lib/s3')
      await deleteFromS3(photoLink)
    }
  } catch (error) {
    console.error('Error deleting photo:', error)
    throw new Error('Failed to delete photo')
  }
}

export async function getPhotos(userId: string) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  return await sql`
    SELECT * FROM clubphoto WHERE userid = ${userId} ORDER BY photolink
  `
}

// Content actions
export async function saveContent(userId: string, contentText: string) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  const [user] = await sql`SELECT * FROM users WHERE userid = ${userId}`
  if (!user || user.role !== 'club') {
    throw new Error('User is not a club')
  }
  
  try {
    // Since userid is primary key, check if exists and update or insert
    const [existing] = await sql`
      SELECT * FROM content WHERE userid = ${userId}
    `
    
    if (existing) {
      await sql`
        UPDATE content SET contenttext = ${contentText} WHERE userid = ${userId}
      `
    } else {
      await sql`
        INSERT INTO content (userid, contenttext)
        VALUES (${userId}, ${contentText})
      `
    }
  } catch (error) {
    console.error('Error saving content:', error)
    throw new Error('Failed to save content')
  }
}

export async function getContent(userId: string) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  const [content] = await sql`
    SELECT * FROM content WHERE userid = ${userId}
  `
  return content || null
}

// Lessons actions
export async function addLesson(userId: string, lessonInfo: string, price: number) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  const [user] = await sql`SELECT * FROM users WHERE userid = ${userId}`
  if (!user || user.role !== 'club') {
    throw new Error('User is not a club')
  }
  
  try {
    await sql`
      INSERT INTO lessons (userid, lessoninfo, price)
      VALUES (${userId}, ${lessonInfo}, ${price})
    `
  } catch (error) {
    console.error('Error adding lesson:', error)
    throw new Error('Failed to add lesson')
  }
}

export async function deleteLesson(userId: string, lessonId: number) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  try {
    await sql`
      DELETE FROM lessons
      WHERE lessonid = ${lessonId} AND userid = ${userId}
    `
  } catch (error) {
    console.error('Error deleting lesson:', error)
    throw new Error('Failed to delete lesson')
  }
}

export async function getLessons(userId: string) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  return await sql`
    SELECT * FROM lessons WHERE userid = ${userId} ORDER BY lessonid DESC
  `
}

// Subscriptions actions
export async function addSubscription(userId: string, subInfo: string, duration: number, price: number) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  const [user] = await sql`SELECT * FROM users WHERE userid = ${userId}`
  if (!user || user.role !== 'club') {
    throw new Error('User is not a club')
  }
  
  try {
    await sql`
      INSERT INTO subscriptions (userid, subinfo, duration, price)
      VALUES (${userId}, ${subInfo}, ${duration}, ${price})
    `
  } catch (error) {
    console.error('Error adding subscription:', error)
    throw new Error('Failed to add subscription')
  }
}

export async function deleteSubscription(userId: string, subId: number) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  try {
    await sql`
      DELETE FROM subscriptions
      WHERE subid = ${subId} AND userid = ${userId}
    `
  } catch (error) {
    console.error('Error deleting subscription:', error)
    throw new Error('Failed to delete subscription')
  }
}

export async function getSubscriptions(userId: string) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  return await sql`
    SELECT * FROM subscriptions WHERE userid = ${userId} ORDER BY subid DESC
  `
}

// Price list actions
export async function addPriceListItem(userId: string, productName: string, price: number) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  const [user] = await sql`SELECT * FROM users WHERE userid = ${userId}`
  if (!user || user.role !== 'club') {
    throw new Error('User is not a club')
  }
  
  try {
    await sql`
      INSERT INTO pricelist (userid, productname, price)
      VALUES (${userId}, ${productName}, ${price})
    `
  } catch (error) {
    console.error('Error adding price list item:', error)
    throw new Error('Failed to add price list item')
  }
}

export async function deletePriceListItem(userId: string, productId: number) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  try {
    await sql`
      DELETE FROM pricelist
      WHERE productid = ${productId} AND userid = ${userId}
    `
  } catch (error) {
    console.error('Error deleting price list item:', error)
    throw new Error('Failed to delete price list item')
  }
}

export async function getPriceList(userId: string) {
  const { userId: authUserId } = await auth()
  if (!authUserId || authUserId !== userId) {
    throw new Error('Unauthorized')
  }
  
  return await sql`
    SELECT * FROM pricelist WHERE userid = ${userId} ORDER BY productid DESC
  `
}

