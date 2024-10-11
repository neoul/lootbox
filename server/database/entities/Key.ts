import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LootboxRoll } from "./LootboxRoll";

@Entity()
export class Key {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 64 })
  public_key!: string;

  @OneToMany(() => LootboxRoll, (roll) => roll.key_id)
  rolls!: LootboxRoll[];
}
