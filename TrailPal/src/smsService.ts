import { Twilio } from 'twilio';

// Twilio credentials (replace with your actual Twilio account credentials)
const accountSid = 'ACda9c72bc1577234c99fb2fa041bb104c';
const authToken = '21f11fc3069603d7a1f54e49e293ac9f';
const twilioPhoneNumber = '+18334557426';

const client = new Twilio(accountSid, authToken);

/**
 * Sends an SMS message using Twilio
 * @param to - The phone number to send the SMS to
 * @param message - The message to send
 * @returns Promise<void>
 */
export const sendSMS = async (to: string, message: string): Promise<void> => {
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber, // Your Twilio phone number
      to: to // Recipient phone number
    });
    
    console.log(`SMS sent successfully: ${result.sid}`);
  } catch (error) {
    console.error(`Failed to send SMS: ${error}`);
    throw error; // You can handle or log this error as needed
  }
};
