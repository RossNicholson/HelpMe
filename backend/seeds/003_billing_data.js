/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing data
  await knex('billing_rates').del();
  await knex('invoices').del();
  await knex('invoice_items').del();

  // Get organization and user IDs
  const organization = await knex('organizations').first();
  const users = await knex('users').limit(3);
  const clients = await knex('clients').limit(2);

  if (!organization || users.length === 0 || clients.length === 0) {
    console.log('Skipping billing data seed - missing required data');
    return;
  }

  // Create default billing rates
  const billingRates = [
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: organization.id,
      rate_name: 'Standard Rate',
      hourly_rate: 150.00,
      rate_type: 'default',
      service_type: 'incident',
      description: 'Standard hourly rate for incident resolution',
      effective_date: new Date('2024-01-01'),
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: organization.id,
      rate_name: 'Emergency Rate',
      hourly_rate: 225.00,
      rate_type: 'default',
      service_type: 'incident',
      description: 'Emergency after-hours support rate',
      effective_date: new Date('2024-01-01'),
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: organization.id,
      rate_name: 'Consultation Rate',
      hourly_rate: 175.00,
      rate_type: 'default',
      service_type: 'consultation',
      description: 'Consultation and planning services',
      effective_date: new Date('2024-01-01'),
      is_active: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: organization.id,
      rate_name: 'Maintenance Rate',
      hourly_rate: 125.00,
      rate_type: 'default',
      service_type: 'maintenance',
      description: 'Preventive maintenance and monitoring',
      effective_date: new Date('2024-01-01'),
      is_active: true
    }
  ];

  // Add user-specific rates
  if (users.length > 0) {
    billingRates.push({
      id: knex.raw('gen_random_uuid()'),
      organization_id: organization.id,
      user_id: users[0].id,
      rate_name: 'Senior Technician Rate',
      hourly_rate: 175.00,
      rate_type: 'user_specific',
      service_type: 'incident',
      description: 'Senior technician specialized rate',
      effective_date: new Date('2024-01-01'),
      is_active: true
    });
  }

  // Add client-specific rates
  if (clients.length > 0) {
    billingRates.push({
      id: knex.raw('gen_random_uuid()'),
      organization_id: organization.id,
      client_id: clients[0].id,
      rate_name: 'Premium Client Rate',
      hourly_rate: 200.00,
      rate_type: 'client_specific',
      service_type: 'incident',
      description: 'Premium client with priority support',
      effective_date: new Date('2024-01-01'),
      is_active: true
    });
  }

  await knex('billing_rates').insert(billingRates);

  // Create sample invoices
  const invoices = [
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: organization.id,
      client_id: clients[0].id,
      invoice_number: 'INV-2024-0001',
      status: 'sent',
      subtotal: 450.00,
      tax_rate: 8.5,
      tax_amount: 38.25,
      total_amount: 488.25,
      balance_due: 488.25,
      invoice_date: new Date('2024-01-15'),
      due_date: new Date('2024-02-14'),
      notes: 'Services provided for January 2024'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      organization_id: organization.id,
      client_id: clients[1].id,
      invoice_number: 'INV-2024-0002',
      status: 'paid',
      subtotal: 300.00,
      tax_rate: 8.5,
      tax_amount: 25.50,
      total_amount: 325.50,
      amount_paid: 325.50,
      balance_due: 0.00,
      invoice_date: new Date('2024-01-20'),
      due_date: new Date('2024-02-19'),
      paid_date: new Date('2024-01-25'),
      notes: 'Emergency support services'
    }
  ];

  const insertedInvoices = await knex('invoices').insert(invoices).returning('*');

  // Create sample invoice items
  const invoiceItems = [
    {
      id: knex.raw('gen_random_uuid()'),
      invoice_id: insertedInvoices[0].id,
      description: 'Network troubleshooting and resolution',
      quantity: 2.0,
      unit_rate: 150.00,
      amount: 300.00,
      item_type: 'time'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      invoice_id: insertedInvoices[0].id,
      description: 'System maintenance and updates',
      quantity: 1.0,
      unit_rate: 150.00,
      amount: 150.00,
      item_type: 'time'
    },
    {
      id: knex.raw('gen_random_uuid()'),
      invoice_id: insertedInvoices[1].id,
      description: 'Emergency server recovery',
      quantity: 2.0,
      unit_rate: 150.00,
      amount: 300.00,
      item_type: 'time'
    }
  ];

  await knex('invoice_items').insert(invoiceItems);

  console.log('✅ Billing data seeded successfully');
}; 