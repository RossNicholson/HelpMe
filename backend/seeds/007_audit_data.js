/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing audit logs
  await knex('audit_logs').del();

  // Get organization and user IDs for seeding
  const organizations = await knex('organizations').select('id');
  const users = await knex('users')
    .join('user_organizations', 'users.id', 'user_organizations.user_id')
    .select('users.id', 'users.first_name', 'users.last_name', 'users.email', 'user_organizations.organization_id');
  const tickets = await knex('tickets').select('id', 'subject', 'organization_id').limit(10);
  const contracts = await knex('contracts').select('id', 'name', 'organization_id').limit(5);
  const clients = await knex('clients').select('id', 'name', 'organization_id').limit(5);

  if (organizations.length === 0 || users.length === 0) {
    console.log('No organizations or users found, skipping audit log seeding');
    return;
  }

  const auditLogs = [];

  // Generate sample audit logs for the last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  for (const org of organizations) {
    const orgUsers = users.filter(u => u.organization_id === org.id);
    const orgTickets = tickets.filter(t => t.organization_id === org.id);
    const orgContracts = contracts.filter(c => c.organization_id === org.id);
    const orgClients = clients.filter(c => c.organization_id === org.id);

    // Generate login events
    for (let i = 0; i < 50; i++) {
      const randomUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];
      const randomDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      
      auditLogs.push({
        organization_id: org.id,
        user_id: randomUser.id,
        action: 'LOGIN',
        entity_type: 'auth',
        entity_id: randomUser.id,
        entity_name: 'User Authentication',
        old_values: null,
        new_values: JSON.stringify({ login_time: randomDate.toISOString() }),
        metadata: JSON.stringify({ 
          ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          session_id: `session_${Math.random().toString(36).substr(2, 9)}`
        }),
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'low',
        description: `User ${randomUser.first_name} ${randomUser.last_name} logged in`,
        timestamp: randomDate
      });
    }

    // Generate ticket events
    for (const ticket of orgTickets) {
      const randomUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];
      const randomDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      
      // Ticket creation
      auditLogs.push({
        organization_id: org.id,
        user_id: randomUser.id,
        action: 'CREATE',
        entity_type: 'tickets',
        entity_id: ticket.id,
        entity_name: ticket.subject,
        old_values: null,
        new_values: JSON.stringify({ 
          subject: ticket.subject,
          status: 'open',
          priority: 'medium'
        }),
        metadata: JSON.stringify({ source: 'web' }),
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'medium',
        description: `Ticket "${ticket.subject}" created`,
        timestamp: randomDate
      });

      // Ticket updates
      for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
        const updateDate = new Date(randomDate.getTime() + Math.random() * (now.getTime() - randomDate.getTime()));
        const randomUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];
        
        auditLogs.push({
          organization_id: org.id,
          user_id: randomUser.id,
          action: 'UPDATE',
          entity_type: 'tickets',
          entity_id: ticket.id,
          entity_name: ticket.subject,
          old_values: JSON.stringify({ status: 'open' }),
          new_values: JSON.stringify({ status: 'in_progress' }),
          metadata: JSON.stringify({ field: 'status' }),
          ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
          severity: 'medium',
          description: `Ticket "${ticket.subject}" status updated to in_progress`,
          timestamp: randomDate
        });
      }
    }

    // Generate contract events
    for (const contract of orgContracts) {
      const randomUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];
      const randomDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      
      auditLogs.push({
        organization_id: org.id,
        user_id: randomUser.id,
        action: 'CREATE',
        entity_type: 'contracts',
        entity_id: contract.id,
        entity_name: contract.name,
        old_values: null,
        new_values: JSON.stringify({ 
          name: contract.name,
          status: 'active'
        }),
        metadata: JSON.stringify({ type: 'service_contract' }),
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'medium',
        description: `Contract "${contract.name}" created`,
        timestamp: randomDate
      });
    }

    // Generate client events
    for (const client of orgClients) {
      const randomUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];
      const randomDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      
      auditLogs.push({
        organization_id: org.id,
        user_id: randomUser.id,
        action: 'UPDATE',
        entity_type: 'clients',
        entity_id: client.id,
        entity_name: client.name,
        old_values: JSON.stringify({ status: 'active' }),
        new_values: JSON.stringify({ status: 'active', last_contact: randomDate.toISOString() }),
        metadata: JSON.stringify({ field: 'last_contact' }),
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'low',
        description: `Client "${client.name}" contact information updated`,
        timestamp: randomDate
      });
    }

    // Generate some security events
    for (let i = 0; i < 5; i++) {
      const randomDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      
      auditLogs.push({
        organization_id: org.id,
        user_id: null,
        action: 'LOGIN_FAILED',
        entity_type: 'security',
        entity_id: null,
        entity_name: 'Security Event',
        old_values: null,
        new_values: null,
        metadata: JSON.stringify({ 
          ip_address: `203.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          attempted_email: `user${Math.floor(Math.random() * 1000)}@example.com`,
          reason: 'Invalid credentials'
        }),
        ip_address: `203.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        session_id: null,
        severity: 'medium',
        description: 'Failed login attempt detected',
        timestamp: randomDate
      });
    }

    // Generate some high severity events
    for (let i = 0; i < 3; i++) {
      const randomUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];
      const randomDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      
      auditLogs.push({
        organization_id: org.id,
        user_id: randomUser.id,
        action: 'PERMISSION_CHANGE',
        entity_type: 'users',
        entity_id: randomUser.id,
        entity_name: 'User Permissions',
        old_values: JSON.stringify({ role: 'user' }),
        new_values: JSON.stringify({ role: 'admin' }),
        metadata: JSON.stringify({ 
          changed_by: 'system_admin',
          reason: 'Role promotion'
        }),
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'high',
        description: `User ${randomUser.first_name} ${randomUser.last_name} role changed to admin`,
        timestamp: randomDate
      });
    }
  }

  // Insert audit logs in batches
  const batchSize = 100;
  for (let i = 0; i < auditLogs.length; i += batchSize) {
    const batch = auditLogs.slice(i, i + batchSize);
    await knex('audit_logs').insert(batch);
  }

  console.log('✅ Audit log seed data created successfully');
  console.log(`📊 Created ${auditLogs.length} audit log entries`);
}; 