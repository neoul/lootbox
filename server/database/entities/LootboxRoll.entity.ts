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
  sequence!: string;

  @Column({
    type: "integer",
    default: () => "floor(random() * 4294967296) - 2147483648",
  })
  nonce!: number;

  @Column("uuid")
  user_id!: string;

  @Column("bigint")
  roll_id!: string;

  @Column("int")
  roll_count!: number;

  @Column({ type: "integer" })
  server_nonce!: number;

  @Column("timestamp")
  server_timestamp!: Date;

  @Column({ type: "varchar", length: 162, nullable: true })
  pi!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;

  @OneToMany(
    () => LootboxRandomNumber,
    (randomNumber) => randomNumber.lootboxRoll
  )
  random_numbers!: LootboxRandomNumber[];
}

@Entity("lootbox_random_numbers")
export class LootboxRandomNumber {
  @PrimaryColumn({ type: "bigint" })
  lootbox_roll_sequence!: string;

  @PrimaryColumn()
  sequence_number!: number;

  @Column("bigint")
  random_number!: string;

  @ManyToOne(() => LootboxRoll, (lootboxRoll) => lootboxRoll.random_numbers)
  @JoinColumn({ name: "lootbox_roll_sequence" })
  lootboxRoll!: LootboxRoll;
}
