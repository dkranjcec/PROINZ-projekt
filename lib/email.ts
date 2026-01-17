import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingConfirmationEmail(
  playerEmail: string,
  playerName: string,
  courtName: string,
  clubName: string,
  startTime: string,
  endTime: string
) {
  try {
    await resend.emails.send({
      from: 'PadelTime <onboarding@resend.dev>', // Use resend.dev for testing, change to your domain later
      to: playerEmail,
      subject: 'Booking Confirmed!',
      html: `
        <h1>Your booking has been confirmed!</h1>
        <p>Hi ${playerName},</p>
        <p>Your booking at <strong>${clubName}</strong> has been confirmed.</p>
        <p><strong>Court:</strong> ${courtName}</p>
        <p><strong>Time:</strong> ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}</p>
        <p>See you there!</p>
      `
    })
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
