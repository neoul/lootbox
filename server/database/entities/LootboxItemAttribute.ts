import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { LootboxItem } from "./LootboxItem";

@Entity()
export class LootboxItemAttribute {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: "varchar", length: 64 })
  value!: string;

  @ManyToOne(() => LootboxItem, (lootboxItem) => lootboxItem.attributes)
  lootboxItem!: LootboxItem;
}
