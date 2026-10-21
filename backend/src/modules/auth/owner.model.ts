import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OwnerModel {
  @Field(() => ID) id: string;
  @Field(() => String, { nullable: true }) name: string | null;
  @Field(() => String, { nullable: true }) email: string | null;
}
