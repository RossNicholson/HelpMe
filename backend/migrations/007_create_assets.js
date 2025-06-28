/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('assets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('asset_tag').unique();
    table.enum('type', ['server', 'workstation', 'laptop', 'mobile_device', 'network_device', 'printer', 'software', 'license', 'other']).notNullable();
    table.string('manufacturer');
    table.string('model');
    table.string('serial_number');
    table.string('ip_address');
    table.string('mac_address');
    table.text('specifications');
    table.enum('status', ['active', 'inactive', 'maintenance', 'retired']).defaultTo('active');
    table.date('purchase_date');
    table.date('warranty_expiry');
    table.decimal('purchase_cost', 10, 2);
    table.text('location');
    table.text('notes');
    table.jsonb('custom_fields').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id']);
    table.index(['client_id']);
    table.index(['asset_tag']);
    table.index(['type']);
    table.index(['status']);
    table.index(['serial_number']);
    table.index(['ip_address']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('assets');
}; 