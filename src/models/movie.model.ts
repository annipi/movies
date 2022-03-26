import {Entity, model, property} from '@loopback/repository';

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
    itemType: 'object',
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

  constructor(data?: Partial<Movie>) {
    super(data);
  }
}

export interface MovieRelations {
  // describe navigational properties here
}

export type MovieWithRelations = Movie & MovieRelations;
