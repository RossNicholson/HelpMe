exports.up = function(knex) {
  return knex.schema.createTable('client_portal_settings', (table) => {
    table.increments('id').primary();
    table.uuid('organization_id').notNullable();
    table.boolean('enabled').defaultTo(true);
    table.string('custom_domain').nullable();
    table.string('logo_url').nullable();
    table.string('primary_color', 7).defaultTo('#3B82F6');
    table.string('secondary_color', 7).defaultTo('#1F2937');
    table.text('welcome_message').nullable();
    table.boolean('allow_ticket_creation').defaultTo(true);
    table.boolean('allow_knowledge_base_access').defaultTo(true);
    table.boolean('allow_asset_viewing').defaultTo(true);
    table.boolean('require_approval_for_tickets').defaultTo(false);
    table.json('custom_fields').nullable();
    table.timestamps(true, true);
    
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.unique(['organization_id']);
  })
  .createTable('client_sessions', (table) => {
    table.increments('id').primary();
    table.uuid('client_id').notNullable();
    table.string('session_token', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.string('ip_address').nullable();
    table.string('user_agent').nullable();
    table.timestamps(true, true);
    
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.index(['session_token']);
    table.index(['expires_at']);
  })
  .createTable('client_notifications', (table) => {
    table.increments('id').primary();
    table.uuid('client_id').notNullable();
    table.uuid('ticket_id').nullable();
    table.string('type').notNullable(); // 'ticket_update', 'ticket_created', 'ticket_resolved', etc.
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.boolean('read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamps(true, true);
    
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');
    table.index(['client_id', 'read']);
  });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('client_notifications')
    .dropTableIfExists('client_sessions')
    .dropTableIfExists('client_portal_settings');
}; 