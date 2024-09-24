import { MigrationInterface, QueryRunner } from "typeorm";

export class LootboxRolls1727155977457 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create lootbox_rolls table
    await queryRunner.query(`
      CREATE TABLE lootbox_rolls (
        sequence BIGSERIAL PRIMARY KEY,
        nonce VARCHAR(32) NOT NULL,
        user_id UUID NOT NULL,
        roll_id BIGINT NOT NULL,
        roll_count INTEGER NOT NULL,
        server_nonce BIGINT NOT NULL,
        server_timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create random_numbers table
    await queryRunner.query(`
      CREATE TABLE random_numbers (
        lootbox_roll_sequence BIGINT REFERENCES lootbox_rolls(sequence) ON DELETE CASCADE,
        sequence_number INTEGER NOT NULL,
        random_number BIGINT NOT NULL,
        PRIMARY KEY (lootbox_roll_sequence, sequence_number)
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_lootbox_rolls_user_id ON lootbox_rolls(user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_lootbox_rolls_roll_id ON lootbox_rolls(roll_id)
    `);

    // Create function to update updated_at column
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create trigger to automatically update the updated_at column
    await queryRunner.query(`
      CREATE TRIGGER update_lootbox_rolls_updated_at
      BEFORE UPDATE ON lootbox_rolls
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_lootbox_rolls_updated_at ON lootbox_rolls
    `);

    // Drop function
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_updated_at_column
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_lootbox_rolls_roll_id
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_lootbox_rolls_user_id
    `);

    // Drop tables
    await queryRunner.query(`
      DROP TABLE IF EXISTS random_numbers
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS lootbox_rolls
    `);
  }
}