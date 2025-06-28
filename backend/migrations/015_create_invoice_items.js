/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('invoice_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE');
    table.uuid('time_entry_id').references('id').inTable('time_entries').onDelete('SET NULL');
    table.uuid('ticket_id').references('id').inTable('tickets').onDelete('SET NULL');
    table.string('description').notNullable();
    table.integer('quantity').defaultTo(1); // For time entries, this is hours
    table.decimal('unit_rate', 10, 2).notNullable(); // Hourly rate for time entries
    table.decimal('amount', 12, 2).notNullable(); // quantity * unit_rate
    table.enum('item_type', ['time', 'product', 'service', 'expense', 'other']).defaultTo('time');
    table.jsonb('metadata').defaultTo('{}'); // Additional item details
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['invoice_id']);
    table.index(['time_entry_id']);
    table.index(['ticket_id']);
    table.index(['item_type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('invoice_items');
}; 