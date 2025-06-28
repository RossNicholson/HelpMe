const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('ticket_comments').del();
  await knex('tickets').del();
  await knex('assets').del();
  await knex('knowledge_base').del();
  await knex('clients').del();
  await knex('user_organizations').del();
  await knex('users').del();
  await knex('organizations').del();

  // Create organization
  const [organization] = await knex('organizations').insert({
    name: 'Demo MSP',
    slug: 'demo-msp',
    description: 'Demo Managed Service Provider',
    email: 'admin@demomsp.com',
    phone: '+1-555-0123',
    timezone: 'America/New_York',
    currency: 'USD'
  }).returning('*');

  // Create users
  const passwordHash = await bcrypt.hash('password123', 12);
  
  const [adminUser] = await knex('users').insert({
    email: 'admin@demomsp.com',
    password_hash: passwordHash,
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
    email_verified: true
  }).returning('*');

  const [technicianUser] = await knex('users').insert({
    email: 'tech@demomsp.com',
    password_hash: passwordHash,
    first_name: 'John',
    last_name: 'Technician',
    role: 'technician',
    is_active: true,
    email_verified: true
  }).returning('*');

  const [clientUser] = await knex('users').insert({
    email: 'client@demomsp.com',
    password_hash: passwordHash,
    first_name: 'Jane',
    last_name: 'Client',
    role: 'client',
    is_active: true,
    email_verified: true
  }).returning('*');

  // Create user-organization relationships
  await knex('user_organizations').insert([
    {
      user_id: adminUser.id,
      organization_id: organization.id,
      role: 'owner'
    },
    {
      user_id: technicianUser.id,
      organization_id: organization.id,
      role: 'technician'
    },
    {
      user_id: clientUser.id,
      organization_id: organization.id,
      role: 'client'
    }
  ]);

  // Create clients
  const [client1] = await knex('clients').insert({
    organization_id: organization.id,
    name: 'ABC Corporation',
    company_name: 'ABC Corp',
    email: 'contact@abccorp.com',
    phone: '+1-555-0100',
    status: 'active',
    hourly_rate: 150.00
  }).returning('*');

  const [client2] = await knex('clients').insert({
    organization_id: organization.id,
    name: 'XYZ Industries',
    company_name: 'XYZ Inc',
    email: 'support@xyzinc.com',
    phone: '+1-555-0200',
    status: 'active',
    hourly_rate: 125.00
  }).returning('*');

  // Create tickets
  const [ticket1] = await knex('tickets').insert({
    organization_id: organization.id,
    client_id: client1.id,
    created_by: clientUser.id,
    assigned_to: technicianUser.id,
    ticket_number: 'TICK-2024-001',
    subject: 'Network connectivity issue',
    description: 'Users are unable to connect to the network. This started happening this morning.',
    priority: 'high',
    status: 'in_progress',
    type: 'incident',
    source: 'portal'
  }).returning('*');

  const [ticket2] = await knex('tickets').insert({
    organization_id: organization.id,
    client_id: client2.id,
    created_by: clientUser.id,
    ticket_number: 'TICK-2024-002',
    subject: 'Software installation request',
    description: 'Need Adobe Creative Suite installed on 5 workstations.',
    priority: 'medium',
    status: 'open',
    type: 'request',
    source: 'portal'
  }).returning('*');

  // Create ticket comments
  await knex('ticket_comments').insert([
    {
      ticket_id: ticket1.id,
      user_id: clientUser.id,
      content: 'This is affecting all users in the office. Please help!',
      type: 'comment',
      is_internal: false
    },
    {
      ticket_id: ticket1.id,
      user_id: technicianUser.id,
      content: 'I\'m investigating the network issue. Will update shortly.',
      type: 'comment',
      is_internal: false
    },
    {
      ticket_id: ticket2.id,
      user_id: clientUser.id,
      content: 'Please let me know when you can schedule this installation.',
      type: 'comment',
      is_internal: false
    }
  ]);

  // Create assets
  await knex('assets').insert([
    {
      organization_id: organization.id,
      client_id: client1.id,
      name: 'Main Server',
      asset_tag: 'SRV-001',
      type: 'server',
      manufacturer: 'Dell',
      model: 'PowerEdge R740',
      serial_number: 'DELL123456',
      ip_address: '192.168.1.100',
      status: 'active',
      location: 'Server Room A'
    },
    {
      organization_id: organization.id,
      client_id: client1.id,
      name: 'Network Switch',
      asset_tag: 'SW-001',
      type: 'network_device',
      manufacturer: 'Cisco',
      model: 'Catalyst 2960',
      serial_number: 'CISCO789012',
      ip_address: '192.168.1.1',
      status: 'active',
      location: 'Server Room A'
    }
  ]);

  // Create knowledge base articles
  await knex('knowledge_base').insert([
    {
      organization_id: organization.id,
      created_by: adminUser.id,
      title: 'How to Reset Network Password',
      content: 'Step-by-step guide for resetting network passwords...',
      slug: 'reset-network-password',
      type: 'how_to',
      visibility: 'client',
      is_published: true
    },
    {
      organization_id: organization.id,
      created_by: technicianUser.id,
      title: 'Common Network Troubleshooting Steps',
      content: 'Standard troubleshooting procedures for network issues...',
      slug: 'network-troubleshooting',
      type: 'troubleshooting',
      visibility: 'internal',
      is_published: true
    }
  ]);

  console.log('✅ Seed data created successfully!');
  console.log('📧 Admin login: admin@demomsp.com / password123');
  console.log('👨‍💻 Tech login: tech@demomsp.com / password123');
  console.log('👤 Client login: client@demomsp.com / password123');
}; 