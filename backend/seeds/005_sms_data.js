exports.seed = async function(knex) {
  // Clear existing data
  await knex('sms_templates').del();
  await knex('sms_settings').del();

  // Fetch real UUID from the database
  const [org1] = await knex('organizations').orderBy('created_at', 'asc').limit(1);

  // Insert SMS settings for organization
  await knex('sms_settings').insert([
    {
      organization_id: org1.id,
      provider: 'twilio',
      enabled: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Insert SMS templates
  await knex('sms_templates').insert([
    {
      organization_id: org1.id,
      name: 'Ticket Created',
      type: 'ticket_created',
      template: 'New ticket #{{ticket_id}} created: {{subject}}. Priority: {{priority}}. Assigned to: {{assigned_to}}.',
      active: true,
      variables: JSON.stringify(['ticket_id', 'subject', 'priority', 'assigned_to']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: org1.id,
      name: 'Ticket Updated',
      type: 'ticket_updated',
      template: 'Ticket #{{ticket_id}} updated: {{subject}}. Status: {{status}}. Updated by: {{updated_by}}.',
      active: true,
      variables: JSON.stringify(['ticket_id', 'subject', 'status', 'updated_by']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: org1.id,
      name: 'SLA Breach Warning',
      type: 'sla_breach_warning',
      template: 'WARNING: Ticket #{{ticket_id}} is approaching SLA breach. Time remaining: {{time_remaining}}. Please take action.',
      active: true,
      variables: JSON.stringify(['ticket_id', 'time_remaining']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: org1.id,
      name: 'SLA Breached',
      type: 'sla_breached',
      template: 'ALERT: Ticket #{{ticket_id}} has breached SLA by {{breach_time}}. Priority: {{priority}}. Immediate attention required.',
      active: true,
      variables: JSON.stringify(['ticket_id', 'breach_time', 'priority']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: org1.id,
      name: 'Escalation Notification',
      type: 'escalation',
      template: 'Ticket #{{ticket_id}} has been escalated to {{escalation_level}}. Reason: {{reason}}. Please review immediately.',
      active: true,
      variables: JSON.stringify(['ticket_id', 'escalation_level', 'reason']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: org1.id,
      name: 'Client Ticket Update',
      type: 'client_ticket_update',
      template: 'Your ticket #{{ticket_id}} has been updated. Status: {{status}}. {{message}}',
      active: true,
      variables: JSON.stringify(['ticket_id', 'status', 'message']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: org1.id,
      name: 'Time Entry Reminder',
      type: 'time_entry_reminder',
      template: 'Reminder: Please log your time for ticket #{{ticket_id}}. Time spent: {{time_spent}}. Description: {{description}}.',
      active: true,
      variables: JSON.stringify(['ticket_id', 'time_spent', 'description']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: org1.id,
      name: 'Invoice Ready',
      type: 'invoice_ready',
      template: 'Invoice #{{invoice_id}} is ready for review. Amount: {{amount}}. Due date: {{due_date}}. View at: {{invoice_url}}.',
      active: true,
      variables: JSON.stringify(['invoice_id', 'amount', 'due_date', 'invoice_url']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: org1.id,
      name: 'Payment Reminder',
      type: 'payment_reminder',
      template: 'Payment reminder: Invoice #{{invoice_id}} for {{amount}} is due on {{due_date}}. Please process payment.',
      active: true,
      variables: JSON.stringify(['invoice_id', 'amount', 'due_date']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: org1.id,
      name: 'System Alert',
      type: 'system_alert',
      template: 'SYSTEM ALERT: {{alert_type}} - {{message}}. Severity: {{severity}}. Please check system immediately.',
      active: true,
      variables: JSON.stringify(['alert_type', 'message', 'severity']),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  console.log('✅ SMS data seeded successfully');
}; 