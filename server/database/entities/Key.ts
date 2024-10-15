import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LootboxRoll } from "./LootboxRoll";

@Entity("keys")
export class Key {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 130, unique: true })
  public_key!: string;

  @OneToMany(() => LootboxRoll, (roll) => roll.key_id)
  rolls!: LootboxRoll[];
}
