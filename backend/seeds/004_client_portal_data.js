exports.seed = async function(knex) {
  // Clear existing data
  await knex('client_notifications').del();
  await knex('client_sessions').del();
  await knex('client_portal_settings').del();

  // Fetch real UUIDs from the database
  const [org1] = await knex('organizations').orderBy('created_at', 'asc').limit(1);
  const [client1] = await knex('clients').orderBy('created_at', 'asc').limit(1);
  const [ticket1] = await knex('tickets').orderBy('created_at', 'asc').limit(1);

  // Insert client portal settings for the organization
  await knex('client_portal_settings').insert([
    {
      organization_id: org1.id,
      enabled: true,
      custom_domain: null,
      logo_url: 'https://example.com/logo.png',
      primary_color: '#3B82F6',
      secondary_color: '#1F2937',
      welcome_message: 'Welcome to our client portal! Submit tickets, track progress, and access our knowledge base.',
      allow_ticket_creation: true,
      allow_knowledge_base_access: true,
      allow_asset_viewing: true,
      require_approval_for_tickets: false,
      custom_fields: JSON.stringify({
        company_size: { type: 'select', options: ['1-10', '11-50', '51-200', '200+'] },
        industry: { type: 'text' },
        preferred_contact: { type: 'select', options: ['Email', 'Phone', 'Portal'] }
      })
    }
  ]);

  // Insert sample client session
  await knex('client_sessions').insert([
    {
      client_id: client1.id,
      session_token: 'sample_session_token_1',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  ]);

  // Insert sample client notifications
  await knex('client_notifications').insert([
    {
      client_id: client1.id,
      ticket_id: ticket1.id,
      type: 'ticket_created',
      title: 'Ticket Created Successfully',
      message: 'Your ticket "Network connectivity issues" has been created and assigned to our support team.',
      read: false
    },
    {
      client_id: client1.id,
      ticket_id: ticket1.id,
      type: 'ticket_updated',
      title: 'Ticket Status Updated',
      message: 'Your ticket "Network connectivity issues" status has been updated to "In Progress".',
      read: true,
      read_at: new Date()
    },
    {
      client_id: client1.id,
      ticket_id: null,
      type: 'system_notification',
      title: 'Portal Maintenance',
      message: 'Scheduled maintenance will occur on Sunday from 2-4 AM. Portal access may be limited during this time.',
      read: false
    }
  ]);

  console.log('✅ Client portal seed data inserted successfully');
}; 