/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing data
  await knex('client_users').del();

  // Get organization and user IDs from existing data
  const organization = await knex('organizations').first();
  const users = await knex('users').select('id', 'email', 'role');
  const clients = await knex('clients').select('id', 'name');

  if (!organization || users.length === 0 || clients.length === 0) {
    console.log('Skipping client users seed - missing required data');
    return;
  }

  const clientUsers = [];

  // Find admin and technician users
  const adminUser = users.find(u => u.role === 'admin');
  const technicianUser = users.find(u => u.role === 'technician');
  const clientUsersList = users.filter(u => u.role === 'client');

  // Associate admin and technician with all clients
  clients.forEach(client => {
    if (adminUser) {
      clientUsers.push({
        user_id: adminUser.id,
        client_id: client.id,
        organization_id: organization.id,
        role: 'primary_contact',
        can_create_tickets: true,
        can_view_all_tickets: true,
        is_active: true,
        permissions: JSON.stringify({
          manage_users: true,
          view_reports: true,
          manage_assets: true
        }),
        notes: 'Admin user with full access'
      });
    }

    if (technicianUser) {
      clientUsers.push({
        user_id: technicianUser.id,
        client_id: client.id,
        organization_id: organization.id,
        role: 'technical_contact',
        can_create_tickets: true,
        can_view_all_tickets: true,
        is_active: true,
        permissions: JSON.stringify({
          manage_tickets: true,
          view_reports: true
        }),
        notes: 'Technician with technical access'
      });
    }
  });

  // Associate client users with specific clients
  if (clientUsersList.length > 0 && clients.length > 0) {
    // ABC Bank - Primary contact
    if (clientUsersList[0] && clients[0]) {
      clientUsers.push({
        user_id: clientUsersList[0].id,
        client_id: clients[0].id,
        organization_id: organization.id,
        role: 'primary_contact',
        can_create_tickets: true,
        can_view_all_tickets: true,
        is_active: true,
        permissions: JSON.stringify({
          create_tickets: true,
          view_own_tickets: true,
          view_all_tickets: true
        }),
        notes: 'Primary contact for ABC Bank'
      });
    }

    // ABC Bank - Secondary contact
    if (clientUsersList[1] && clients[0]) {
      clientUsers.push({
        user_id: clientUsersList[1].id,
        client_id: clients[0].id,
        organization_id: organization.id,
        role: 'secondary_contact',
        can_create_tickets: true,
        can_view_all_tickets: false,
        is_active: true,
        permissions: JSON.stringify({
          create_tickets: true,
          view_own_tickets: true
        }),
        notes: 'Secondary contact for ABC Bank'
      });
    }

    // TechCorp - Primary contact
    if (clientUsersList[2] && clients[1]) {
      clientUsers.push({
        user_id: clientUsersList[2].id,
        client_id: clients[1].id,
        organization_id: organization.id,
        role: 'primary_contact',
        can_create_tickets: true,
        can_view_all_tickets: true,
        is_active: true,
        permissions: JSON.stringify({
          create_tickets: true,
          view_own_tickets: true,
          view_all_tickets: true
        }),
        notes: 'Primary contact for TechCorp'
      });
    }

    // TechCorp - Billing contact
    if (clientUsersList[3] && clients[1]) {
      clientUsers.push({
        user_id: clientUsersList[3].id,
        client_id: clients[1].id,
        organization_id: organization.id,
        role: 'billing_contact',
        can_create_tickets: false,
        can_view_all_tickets: false,
        is_active: true,
        permissions: JSON.stringify({
          view_billing: true
        }),
        notes: 'Billing contact for TechCorp'
      });
    }

    // Global Solutions - End user
    if (clientUsersList[4] && clients[2]) {
      clientUsers.push({
        user_id: clientUsersList[4].id,
        client_id: clients[2].id,
        organization_id: organization.id,
        role: 'end_user',
        can_create_tickets: true,
        can_view_all_tickets: false,
        is_active: true,
        permissions: JSON.stringify({
          create_tickets: true,
          view_own_tickets: true
        }),
        notes: 'End user for Global Solutions'
      });
    }
  }

  // Insert client users
  if (clientUsers.length > 0) {
    await knex('client_users').insert(clientUsers);
    console.log(`✅ Seeded ${clientUsers.length} client user associations`);
  } else {
    console.log('⚠️  No client users to seed');
  }
}; 