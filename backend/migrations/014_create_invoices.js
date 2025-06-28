/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.string('invoice_number').unique().notNullable();
    table.enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']).defaultTo('draft');
    table.decimal('subtotal', 12, 2).defaultTo(0);
    table.decimal('tax_rate', 5, 2).defaultTo(0);
    table.decimal('tax_amount', 12, 2).defaultTo(0);
    table.decimal('total_amount', 12, 2).defaultTo(0);
    table.decimal('amount_paid', 12, 2).defaultTo(0);
    table.decimal('balance_due', 12, 2).defaultTo(0);
    table.date('invoice_date').notNullable();
    table.date('due_date').notNullable();
    table.date('paid_date');
    table.text('notes');
    table.jsonb('billing_address').defaultTo('{}');
    table.jsonb('shipping_address').defaultTo('{}');
    table.jsonb('payment_terms').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id']);
    table.index(['client_id']);
    table.index(['invoice_number']);
    table.index(['status']);
    table.index(['invoice_date']);
    table.index(['due_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('invoices');
}; 