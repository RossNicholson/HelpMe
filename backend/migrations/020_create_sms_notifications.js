exports.up = function(knex) {
  return knex.schema.createTable('sms_settings', (table) => {
    table.increments('id').primary();
    table.integer('organization_id').unsigned().notNullable();
    table.string('provider').notNullable().defaultTo('twilio'); // twilio, aws_sns, etc.
    table.string('account_sid').nullable();
    table.string('auth_token').nullable();
    table.string('from_number').nullable();
    table.boolean('enabled').defaultTo(false);
    table.json('provider_config').nullable(); // Additional provider-specific settings
    table.timestamps(true, true);
    
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.unique(['organization_id']);
  })
  .createTable('sms_templates', (table) => {
    table.increments('id').primary();
    table.integer('organization_id').unsigned().notNullable();
    table.string('name').notNullable();
    table.string('type').notNullable(); // ticket_created, ticket_updated, sla_breach, etc.
    table.text('template').notNullable();
    table.boolean('active').defaultTo(true);
    table.json('variables').nullable(); // Available template variables
    table.timestamps(true, true);
    
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.index(['organization_id', 'type']);
  })
  .createTable('sms_notifications', (table) => {
    table.increments('id').primary();
    table.integer('organization_id').unsigned().notNullable();
    table.integer('user_id').unsigned().nullable();
    table.integer('client_id').unsigned().nullable();
    table.integer('ticket_id').unsigned().nullable();
    table.string('to_number').notNullable();
    table.string('from_number').notNullable();
    table.text('message').notNullable();
    table.string('status').notNullable().defaultTo('pending'); // pending, sent, delivered, failed
    table.string('provider_message_id').nullable(); // Provider's message ID for tracking
    table.json('provider_response').nullable(); // Full provider response
    table.timestamp('sent_at').nullable();
    table.timestamp('delivered_at').nullable();
    table.text('error_message').nullable();
    table.integer('retry_count').defaultTo(0);
    table.timestamp('next_retry_at').nullable();
    table.timestamps(true, true);
    
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');
    table.index(['status', 'sent_at']);
    table.index(['to_number']);
  })
  .createTable('user_sms_preferences', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('phone_number').notNullable();
    table.boolean('verified').defaultTo(false);
    table.timestamp('verified_at').nullable();
    table.boolean('enabled').defaultTo(true);
    table.json('notification_types').nullable(); // Which types of notifications to receive
    table.json('schedule').nullable(); // When to send notifications (business hours, etc.)
    table.timestamps(true, true);
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.unique(['user_id', 'phone_number']);
  })
  .createTable('client_sms_preferences', (table) => {
    table.increments('id').primary();
    table.integer('client_id').unsigned().notNullable();
    table.string('phone_number').notNullable();
    table.boolean('verified').defaultTo(false);
    table.timestamp('verified_at').nullable();
    table.boolean('enabled').defaultTo(true);
    table.json('notification_types').nullable(); // Which types of notifications to receive
    table.json('schedule').nullable(); // When to send notifications
    table.timestamps(true, true);
    
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.unique(['client_id', 'phone_number']);
  });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('client_sms_preferences')
    .dropTableIfExists('user_sms_preferences')
    .dropTableIfExists('sms_notifications')
    .dropTableIfExists('sms_templates')
    .dropTableIfExists('sms_settings');
}; 