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

  @OneToMany(() => RandomNumber, (randomNumber) => randomNumber.lootboxRoll)
  random_numbers!: RandomNumber[];
}

@Entity("random_numbers")
export class RandomNumber {
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

// // LootboxInput 및 LootboxOutput 타입 정의
// export type LootboxInputType = {
//   user_id: string;
//   roll_id: bigint;
//   roll_count: number;
// };

// export type LootboxOutputType = LootboxInputType & {
//   sequence: bigint;
//   nonce: string;
//   server_nonce: string;
//   server_timestamp: Date;
//   random_number: bigint[];
// };

// // LootboxRoll 엔티티를 LootboxOutputType으로 변환하는 함수
// export function convertToLootboxOutput(
//   lootboxRoll: LootboxRoll
// ): LootboxOutputType {
//   return {
//     user_id: lootboxRoll.user_id,
//     roll_id: lootboxRoll.roll_id,
//     roll_count: lootboxRoll.roll_count,
//     server_nonce: lootboxRoll.server_nonce,
//     server_timestamp: lootboxRoll.server_timestamp,
//     sequence: lootboxRoll.sequence,
//     nonce: lootboxRoll.nonce,
//     random_number: lootboxRoll.random_numbers.map((rn) => rn.random_number),
//   };
// }
