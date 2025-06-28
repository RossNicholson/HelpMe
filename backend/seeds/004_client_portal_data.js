exports.seed = async function(knex) {
  // Clear existing data
  await knex('client_notifications').del();
  await knex('client_sessions').del();
  await knex('client_portal_settings').del();

  // Insert client portal settings for organizations
  await knex('client_portal_settings').insert([
    {
      organization_id: 1,
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
    },
    {
      organization_id: 2,
      enabled: true,
      custom_domain: 'support.techcorp.com',
      logo_url: 'https://techcorp.com/logo.png',
      primary_color: '#10B981',
      secondary_color: '#374151',
      welcome_message: 'TechCorp Support Portal - Your IT solutions partner.',
      allow_ticket_creation: true,
      allow_knowledge_base_access: true,
      allow_asset_viewing: true,
      require_approval_for_tickets: true,
      custom_fields: JSON.stringify({
        service_tier: { type: 'select', options: ['Basic', 'Professional', 'Enterprise'] },
        emergency_contact: { type: 'text' }
      })
    }
  ]);

  // Insert sample client sessions
  await knex('client_sessions').insert([
    {
      client_id: 1,
      session_token: 'sample_session_token_1',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      client_id: 2,
      session_token: 'sample_session_token_2',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  ]);

  // Insert sample client notifications
  await knex('client_notifications').insert([
    {
      client_id: 1,
      ticket_id: 1,
      type: 'ticket_created',
      title: 'Ticket Created Successfully',
      message: 'Your ticket "Network connectivity issues" has been created and assigned to our support team.',
      read: false
    },
    {
      client_id: 1,
      ticket_id: 1,
      type: 'ticket_updated',
      title: 'Ticket Status Updated',
      message: 'Your ticket "Network connectivity issues" status has been updated to "In Progress".',
      read: true,
      read_at: new Date()
    },
    {
      client_id: 2,
      ticket_id: 2,
      type: 'ticket_created',
      title: 'Ticket Created Successfully',
      message: 'Your ticket "Software installation request" has been created and is pending approval.',
      read: false
    },
    {
      client_id: 2,
      ticket_id: null,
      type: 'system_notification',
      title: 'Portal Maintenance',
      message: 'Scheduled maintenance will occur on Sunday from 2-4 AM. Portal access may be limited during this time.',
      read: false
    }
  ]);

  console.log('✅ Client portal seed data inserted successfully');
}; 