/**
 * Service Email - Envoi de courriels
 */
import { supabase } from '@/lib/supabase/client';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Blob;
    contentType?: string;
  }>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}

// Templates prédéfinis
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'soumission',
    name: 'Envoi de soumission',
    subject: 'Soumission {{numero}} - {{project_name}}',
    body: `Bonjour {{client_name}},

Veuillez trouver ci-joint notre soumission {{numero}} pour le projet {{project_name}}.

Montant total: {{montant_total}} $

Cette soumission est valide jusqu'au {{date_expiration}}.

N'hésitez pas à nous contacter pour toute question.

Cordialement,
{{company_name}}`,
    variables: ['numero', 'project_name', 'client_name', 'montant_total', 'date_expiration', 'company_name']
  },
  {
    id: 'facture',
    name: 'Envoi de facture',
    subject: 'Facture {{numero}} - {{project_name}}',
    body: `Bonjour {{client_name}},

Veuillez trouver ci-joint la facture {{numero}} pour le projet {{project_name}}.

Montant total: {{montant_total}} $
Date d'échéance: {{date_echeance}}

Merci de votre confiance.

Cordialement,
{{company_name}}`,
    variables: ['numero', 'project_name', 'client_name', 'montant_total', 'date_echeance', 'company_name']
  },
  {
    id: 'rappel_paiement',
    name: 'Rappel de paiement',
    subject: 'Rappel - Facture {{numero}} en attente',
    body: `Bonjour {{client_name}},

Nous souhaitons vous rappeler que la facture {{numero}} d'un montant de {{montant_total}} $ est en attente de paiement.

Date d'échéance: {{date_echeance}}

Merci de procéder au règlement dans les meilleurs délais.

Cordialement,
{{company_name}}`,
    variables: ['numero', 'client_name', 'montant_total', 'date_echeance', 'company_name']
  }
];

class EmailService {
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this would call Supabase Edge Function or email API
      // For now, log and simulate success
      console.log('Sending email:', options);
      
      // Save to email history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('email_history').insert([{
          user_id: user.id,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          body: options.body,
          status: 'sent',
          sent_at: new Date().toISOString()
        }]);
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  parseTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });
    
    return { subject, body };
  }

  async sendSoumission(soumission: any, toEmail: string): Promise<{ success: boolean; error?: string }> {
    const template = EMAIL_TEMPLATES.find(t => t.id === 'soumission')!;
    const { subject, body } = this.parseTemplate(template, {
      numero: soumission.numero,
      project_name: soumission.project_name || 'N/A',
      client_name: soumission.client_name || 'Client',
      montant_total: soumission.montant_total?.toFixed(2) || '0.00',
      date_expiration: soumission.date_expiration || 'N/A',
      company_name: 'DAST Solutions'
    });
    
    return this.sendEmail({ to: toEmail, subject, body });
  }

  async sendFacture(facture: any, toEmail: string): Promise<{ success: boolean; error?: string }> {
    const template = EMAIL_TEMPLATES.find(t => t.id === 'facture')!;
    const { subject, body } = this.parseTemplate(template, {
      numero: facture.numero,
      project_name: facture.project_name || 'N/A',
      client_name: facture.client_name || 'Client',
      montant_total: facture.montant_total?.toFixed(2) || '0.00',
      date_echeance: facture.date_echeance || 'N/A',
      company_name: 'DAST Solutions'
    });
    
    return this.sendEmail({ to: toEmail, subject, body });
  }

  getTemplates(): EmailTemplate[] {
    return EMAIL_TEMPLATES;
  }
}

export const emailService = new EmailService();

// Helper functions for direct exports
export async function sendFactureEmail(facture: any, toEmail: string): Promise<{ success: boolean; error?: string }> {
  return emailService.sendFacture(facture, toEmail);
}

export async function sendFactureRappel(facture: any, toEmail: string): Promise<{ success: boolean; error?: string }> {
  const template = EMAIL_TEMPLATES.find(t => t.id === 'rappel_paiement')!;
  const { subject, body } = emailService.parseTemplate(template, {
    numero: facture.numero,
    client_name: facture.client_name || 'Client',
    montant_total: facture.montant_total?.toFixed(2) || '0.00',
    date_echeance: facture.date_echeance || 'N/A',
    company_name: 'DAST Solutions'
  });
  
  return emailService.sendEmail({ to: toEmail, subject, body });
}

export async function sendSoumissionEmail(soumission: any, toEmail: string): Promise<{ success: boolean; error?: string }> {
  return emailService.sendSoumission(soumission, toEmail);
}

export default emailService;
