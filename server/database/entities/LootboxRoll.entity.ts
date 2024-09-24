import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from "typeorm";

@Entity("lootbox_rolls")
export class LootboxRoll {
  @PrimaryGeneratedColumn({ type: "bigint" })
  sequence!: bigint;

  @Column({ length: 32 })
  nonce!: string;

  @Column("uuid")
  user_id!: string;

  @Column("bigint")
  roll_id!: bigint;

  @Column("int")
  roll_count!: number;

  @Column("bigint")
  server_nonce!: bigint;

  @Column("timestamp")
  server_timestamp!: Date;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;

  @OneToMany(() => LootboxRandomNumber, (randomNumber) => randomNumber.lootboxRoll)
  random_numbers!: LootboxRandomNumber[];
}

@Entity("lootbox_random_numbers")
export class LootboxRandomNumber {
  @PrimaryColumn({ type: "bigint" })
  lootbox_roll_sequence!: bigint;

  @PrimaryColumn()
  sequence_number!: number;

  @Column("bigint")
  random_number!: bigint;

  @ManyToOne(() => LootboxRoll, (lootboxRoll) => lootboxRoll.random_numbers)
  @JoinColumn({ name: "lootbox_roll_sequence" })
  lootboxRoll!: LootboxRoll;
}
