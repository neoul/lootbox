import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LootboxRoll } from "./LootboxRoll";

@Entity("vrf_key")
export class VRFKey {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 130, unique: true })
  public_key!: string;

  @OneToMany(() => LootboxRoll, (roll) => roll.key_id)
  rolls!: LootboxRoll[];
}
