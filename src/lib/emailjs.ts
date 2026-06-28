import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

export interface RiderReportParams {
  riderName: string;
  riderPlate: string;
  riderPhone: string;
  remarks?: string;
}

export async function sendRiderReport(params: RiderReportParams): Promise<{ success: boolean; error?: string }> {
  try {
    const message = [
      `=== RIDER REPORT ===`,
      `Rider Name: ${params.riderName}`,
      `Plate Number: ${params.riderPlate}`,
      `Phone: ${params.riderPhone}`,
      ``,
      `Remarks from reporter:`,
      params.remarks?.trim() || '(No remarks provided)',
      ``,
      `--- Submitted via Skitech Smart Rider Public Page ---`,
    ].join('\n');

    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        from_name: 'Anonymous',
        from_email: 'anonymous@report.skitech.co.ke',
        subject: 'RIDER REPORT',
        to_name: 'Skitech Smart Rider Admin',
        message,
        reply_to: 'anonymous@report.skitech.co.ke',
      },
      PUBLIC_KEY
    );

    return { success: true };
  } catch (err: any) {
    console.error('EmailJS error:', err);
    return { success: false, error: err?.text || 'Failed to send report' };
  }
}
