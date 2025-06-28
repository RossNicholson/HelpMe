/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('escalation_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.enum('trigger_type', ['time_based', 'priority_change', 'status_change', 'manual']).notNullable();
    table.integer('trigger_hours').defaultTo(0); // Hours after which to escalate
    table.enum('trigger_priority', ['low', 'medium', 'high', 'critical']); // Priority level to trigger escalation
    table.enum('trigger_status', ['open', 'in_progress', 'waiting_on_client', 'waiting_on_third_party']); // Status to trigger escalation
    table.enum('action_type', ['notify_manager', 'reassign_ticket', 'change_priority', 'notify_stakeholders']).notNullable();
    table.uuid('target_user_id').references('id').inTable('users').onDelete('SET NULL'); // User to assign to
    table.uuid('target_role_id').references('id').inTable('roles').onDelete('SET NULL'); // Role to assign to
    table.enum('new_priority', ['low', 'medium', 'high', 'critical']); // New priority if changing priority
    table.jsonb('notification_recipients').defaultTo('[]'); // Array of email addresses
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id']);
    table.index(['trigger_type']);
    table.index(['trigger_priority']);
    table.index(['trigger_status']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('escalation_rules');
}; 