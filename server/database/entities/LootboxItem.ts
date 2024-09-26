import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { LootboxItemAttribute } from "./LootboxItemAttribute";

@Entity()
export class LootboxItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 128 })
  name!: string;

  @Column({ type: "varchar", length: 256 })
  uri!: string;

  @Column("text")
  description!: string;

  @Column({ type: "varchar", length: 64 })
  category!: string;

  @Column({ type: "varchar", length: 32 })
  grade!: string;

  @Column()
  tier!: number;

  @OneToMany(() => LootboxItemAttribute, (attribute) => attribute.lootboxItem)
  attributes!: LootboxItemAttribute[];
}
