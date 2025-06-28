/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Get the first organization
  const organization = await knex('organizations').first();
  if (!organization) {
    console.log('No organization found, skipping SLA seed data');
    return;
  }

  // Get some users for escalation targets
  const users = await knex('users').limit(3);
  const manager = users[0];
  const technician = users[1];

  // Create roles
  const [adminRole] = await knex('roles').insert({
    organization_id: organization.id,
    name: 'Administrator',
    description: 'Full system access',
    permissions: JSON.stringify({
      tickets: ['read', 'write', 'delete'],
      clients: ['read', 'write', 'delete'],
      assets: ['read', 'write', 'delete'],
      sla: ['read', 'write', 'delete'],
      escalation: ['read', 'write', 'delete'],
      reports: ['read'],
      users: ['read', 'write', 'delete']
    }),
    is_system_role: true,
    is_active: true
  }).returning('*');

  const [techRole] = await knex('roles').insert({
    organization_id: organization.id,
    name: 'Technician',
    description: 'Standard technician access',
    permissions: JSON.stringify({
      tickets: ['read', 'write'],
      clients: ['read'],
      assets: ['read', 'write'],
      sla: ['read'],
      escalation: ['read'],
      reports: ['read'],
      users: ['read']
    }),
    is_system_role: true,
    is_active: true
  }).returning('*');

  // Create SLA Definitions
  const slaDefinitions = [
    {
      organization_id: organization.id,
      name: 'Critical Incident Response',
      description: 'SLA for critical incidents requiring immediate attention',
      priority: 'critical',
      ticket_type: 'incident',
      response_time_hours: 1,
      resolution_time_hours: 4,
      business_hours_start: 9,
      business_hours_end: 17,
      business_days: [1, 2, 3, 4, 5], // Monday to Friday
      holidays: ['2024-12-25', '2024-01-01'], // Christmas and New Year
      is_active: true
    },
    {
      organization_id: organization.id,
      name: 'High Priority Incident Response',
      description: 'SLA for high priority incidents',
      priority: 'high',
      ticket_type: 'incident',
      response_time_hours: 2,
      resolution_time_hours: 8,
      business_hours_start: 9,
      business_hours_end: 17,
      business_days: [1, 2, 3, 4, 5],
      holidays: ['2024-12-25', '2024-01-01'],
      is_active: true
    },
    {
      organization_id: organization.id,
      name: 'Medium Priority Incident Response',
      description: 'SLA for medium priority incidents',
      priority: 'medium',
      ticket_type: 'incident',
      response_time_hours: 4,
      resolution_time_hours: 24,
      business_hours_start: 9,
      business_hours_end: 17,
      business_days: [1, 2, 3, 4, 5],
      holidays: ['2024-12-25', '2024-01-01'],
      is_active: true
    },
    {
      organization_id: organization.id,
      name: 'Low Priority Incident Response',
      description: 'SLA for low priority incidents',
      priority: 'low',
      ticket_type: 'incident',
      response_time_hours: 8,
      resolution_time_hours: 48,
      business_hours_start: 9,
      business_hours_end: 17,
      business_days: [1, 2, 3, 4, 5],
      holidays: ['2024-12-25', '2024-01-01'],
      is_active: true
    },
    {
      organization_id: organization.id,
      name: 'Service Request Response',
      description: 'SLA for service requests',
      priority: 'medium',
      ticket_type: 'request',
      response_time_hours: 4,
      resolution_time_hours: 72,
      business_hours_start: 9,
      business_hours_end: 17,
      business_days: [1, 2, 3, 4, 5],
      holidays: ['2024-12-25', '2024-01-01'],
      is_active: true
    }
  ];

  await knex('sla_definitions').insert(slaDefinitions);

  // Create Escalation Rules
  const escalationRules = [
    {
      organization_id: organization.id,
      name: 'Critical Incident Escalation',
      description: 'Escalate critical incidents after 2 hours without response',
      trigger_type: 'time_based',
      trigger_hours: 2,
      action_type: 'notify_manager',
      target_user_id: manager?.id,
      notification_recipients: ['manager@example.com'],
      is_active: true
    },
    {
      organization_id: organization.id,
      name: 'High Priority Escalation',
      description: 'Escalate high priority tickets after 4 hours',
      trigger_type: 'time_based',
      trigger_hours: 4,
      action_type: 'reassign_ticket',
      target_role_id: techRole.id,
      is_active: true
    },
    {
      organization_id: organization.id,
      name: 'Priority Increase on Long Wait',
      description: 'Increase priority of tickets waiting too long',
      trigger_type: 'time_based',
      trigger_hours: 24,
      action_type: 'change_priority',
      new_priority: 'high',
      is_active: true
    },
    {
      organization_id: organization.id,
      name: 'Stakeholder Notification',
      description: 'Notify stakeholders of critical incidents',
      trigger_type: 'priority_change',
      trigger_priority: 'critical',
      action_type: 'notify_stakeholders',
      notification_recipients: ['stakeholder@example.com', 'management@example.com'],
      is_active: true
    }
  ];

  await knex('escalation_rules').insert(escalationRules);

  console.log('✅ SLA and escalation seed data created successfully');
}; 