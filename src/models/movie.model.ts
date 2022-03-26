import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';

@model()
export class Movie extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'string',
    required: true,
  })
  director: string;

  @property({
    type: 'array',
    itemType: 'string',
  })
  cast?: string[];

  @property({
    type: 'string',
  })
  synopsis?: string;

  @property({
    type: 'number',
    required: true,
  })
  duration: number;

  @property({
    type: 'number',
  })
  year: number;

  @property({
    type: 'string',
  })
  genre: number;

  @property({
    type: 'boolean',
  })
  isPublic: boolean;

  @belongsTo(() => User)
  userId: number;

  constructor(data?: Partial<Movie>) {
    super(data);
  }
}

export interface MovieRelations {
  // describe navigational properties here
}

export type MovieWithRelations = Movie & MovieRelations;
