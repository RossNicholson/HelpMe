/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing data
  await knex('contracts').del();

  // Get organization and user IDs
  const organization = await knex('organizations').first();
  const admin = await knex('users').where('role', 'admin').first();
  const client1 = await knex('clients').first();
  const client2 = await knex('clients').offset(1).first();

  if (!organization || !admin || !client1 || !client2) {
    console.log('Required data not found for contract seeding');
    return;
  }

  const contracts = [
    {
      organization_id: organization.id,
      client_id: client1.id,
      contract_number: 'CON-2025-0001',
      name: 'Managed IT Services - Premium',
      description: 'Comprehensive managed IT services including 24/7 monitoring, helpdesk support, and proactive maintenance.',
      type: 'managed_services',
      status: 'active',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      monthly_rate: 2500.00,
      hourly_rate: 150.00,
      hours_per_month: 40,
      service_levels: JSON.stringify({
        response_time: {
          critical: '1 hour',
          high: '4 hours',
          medium: '8 hours',
          low: '24 hours'
        },
        uptime_guarantee: '99.9%',
        backup_retention: '30 days'
      }),
      billing_terms: JSON.stringify({
        billing_cycle: 'monthly',
        payment_terms: 'Net 15',
        late_fee: '1.5%',
        auto_renewal: true
      }),
      terms_and_conditions: { text: 'Standard MSP service agreement terms apply. Services are provided on a best-effort basis with SLA guarantees as outlined above.' },
      notes: 'Premium client with high service expectations. Regular check-ins required.',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: organization.id,
      client_id: client2.id,
      contract_number: 'CON-2025-0002',
      name: 'Project-Based Network Upgrade',
      description: 'Complete network infrastructure upgrade including new switches, routers, and wireless access points.',
      type: 'project_based',
      status: 'active',
      start_date: '2025-02-01',
      end_date: '2025-05-31',
      monthly_rate: 0.00,
      hourly_rate: 125.00,
      hours_per_month: 0,
      service_levels: JSON.stringify({
        project_timeline: '4 months',
        milestone_deliverables: [
          'Network assessment',
          'Design documentation',
          'Implementation plan',
          'Testing and validation',
          'Training and handover'
        ]
      }),
      billing_terms: JSON.stringify({
        billing_cycle: 'milestone',
        payment_terms: 'Net 30',
        deposit_required: '25%',
        progress_payments: true
      }),
      terms_and_conditions: { text: 'Project timeline and deliverables are subject to client approval and cooperation. Additional work outside scope will be billed separately.' },
      notes: 'Client has existing network that needs complete overhaul. Budget approved for Q1.',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: organization.id,
      client_id: client1.id,
      contract_number: 'CON-2025-0003',
      name: 'Break-Fix Support Agreement',
      description: 'On-demand technical support for hardware and software issues.',
      type: 'break_fix',
      status: 'draft',
      start_date: '2025-03-01',
      end_date: '2025-08-31',
      monthly_rate: 0.00,
      hourly_rate: 95.00,
      hours_per_month: 0,
      service_levels: JSON.stringify({
        response_time: {
          critical: '4 hours',
          high: '8 hours',
          medium: '24 hours',
          low: '48 hours'
        },
        emergency_support: 'Available 24/7 with premium rates'
      }),
      billing_terms: JSON.stringify({
        billing_cycle: 'hourly',
        payment_terms: 'Net 15',
        minimum_billing: '1 hour',
        emergency_rate: '150% of standard rate'
      }),
      terms_and_conditions: { text: 'Services provided on a time and materials basis. Emergency support available at premium rates.' },
      notes: 'Draft contract pending client approval. Expected to be signed by end of February.',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      organization_id: organization.id,
      client_id: client2.id,
      contract_number: 'CON-2024-0004',
      name: 'Retainer Agreement - IT Consulting',
      description: 'Monthly retainer for IT consulting and strategic planning services.',
      type: 'retainer',
      status: 'expired',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      monthly_rate: 1500.00,
      hourly_rate: 100.00,
      hours_per_month: 20,
      service_levels: JSON.stringify({
        response_time: '48 hours',
        included_services: [
          'IT strategy consulting',
          'Technology planning',
          'Vendor evaluation',
          'Budget planning',
          'Security assessments'
        ]
      }),
      billing_terms: JSON.stringify({
        billing_cycle: 'monthly',
        payment_terms: 'Net 30',
        unused_hours: 'Roll over to next month (max 40 hours)',
        overage_rate: 'Standard hourly rate'
      }),
      terms_and_conditions: { text: 'Retainer hours must be used within the contract period. Unused hours roll over with limitations.' },
      notes: 'Contract expired. Client considering renewal with expanded scope.',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('contracts').insert(contracts);
  
  console.log('✅ Contract data seeded successfully');
  console.log('📋 Sample contracts created:');
  console.log('   - Managed Services (Active)');
  console.log('   - Project-Based (Active)');
  console.log('   - Break-Fix (Draft)');
  console.log('   - Retainer (Expired)');
}; 