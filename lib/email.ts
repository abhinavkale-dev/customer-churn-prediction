import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

interface EmailParams {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

const sesClient = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const emailService = {
  send: async ({ from, to, subject, html, text }: EmailParams) => {
    console.log("SES Sending via SDK:", {
      region: process.env.AWS_REGION,
      accessKeyPrefix: process.env.AWS_ACCESS_KEY_ID?.slice(0, 4) + "…",
    });

    const params = {
      Source: from,
      Destination: { ToAddresses: to },
      Message: {
        Subject: { Charset: "UTF-8", Data: subject },
        Body: {
          Html: { Charset: "UTF-8", Data: html },
          ...(text && { Text: { Charset: "UTF-8", Data: text } }),
        },
      },
    };

    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    return {
      success: true,
      id: response.MessageId,
    };
  },
}; 