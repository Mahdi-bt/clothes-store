export interface EmailTemplate {
  subject: string;
  body: string;
}

export const emailTemplates = {
  processing: (orderId: string, customerName: string): EmailTemplate => ({
    subject: `Order #${orderId} is now being processed`,
    body: `
      Dear ${customerName},

      We are pleased to inform you that your order #${orderId} is now being processed. Our team is working diligently to prepare your items for delivery.

      You will receive another notification when your order is ready for delivery.

      Thank you for choosing our store!

      Best regards,
      Your Store Team
    `
  }),
  cancelled: (orderId: string, customerName: string): EmailTemplate => ({
    subject: `Order #${orderId} has been cancelled`,
    body: `
      Dear ${customerName},

      We regret to inform you that your order #${orderId} has been cancelled.

      If you have any questions or concerns, please don't hesitate to contact our customer service team.

      We apologize for any inconvenience this may have caused.

      Best regards,
      Your Store Team
    `
  })
}; 