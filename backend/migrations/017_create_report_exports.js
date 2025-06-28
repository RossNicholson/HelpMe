/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('report_exports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('report_id').references('id').inTable('reports').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('requested_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('format', ['pdf', 'excel', 'csv', 'json']).notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
    table.string('file_path'); // Path to generated file
    table.string('file_name');
    table.integer('file_size'); // Size in bytes
    table.jsonb('export_data').defaultTo('{}'); // Actual report data
    table.text('error_message'); // If export failed
    table.timestamp('completed_at');
    table.timestamp('expires_at'); // When file should be deleted
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['report_id']);
    table.index(['organization_id']);
    table.index(['requested_by']);
    table.index(['status']);
    table.index(['created_at']);
    table.index(['expires_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('report_exports');
}; 