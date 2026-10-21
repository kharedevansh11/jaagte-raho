import { Field, ObjectType } from '@nestjs/graphql';
import { Call } from './call.model.js';

/** One page of a driver's call history, newest first. */
@ObjectType()
export class CallPage {
  @Field(() => [Call]) items: Call[];
  /** Pass as `after` to get the next (older) page; null when there are no more. */
  @Field(() => String, { nullable: true }) nextCursor: string | null;
}
