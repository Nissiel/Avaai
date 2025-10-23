export interface MockEmail {
  to: string[];
  subject: string;
  html: string;
}

const sent: MockEmail[] = [];

export async function sendEmail(message: MockEmail) {
  sent.push(message);
  return { id: `email_${sent.length}` };
}

export function getSentEmails() {
  return sent;
}
