/* eslint @typescript-eslint/naming-convention: 0 */
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response, HttpErrors,
} from '@loopback/rest';
import {Movie, User} from '../models';
import {MovieRepository} from '../repositories';
import {SessionService} from '../services';
import {service} from '@loopback/core';

export class MoviesController {
  constructor(
    @repository(MovieRepository)
    public movieRepository : MovieRepository,
    @service(SessionService)
    public sessionService : SessionService,
  ) {}

  @post('/movies')
  @response(200, {
    description: 'Movie model instance',
    content: {'application/json': {schema: getModelSchemaRef(Movie)}},
  })
  async create(
    @param.header.string('token') token: typeof User.prototype.token,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Movie, {
            title: 'NewMovie',
            exclude: ['id'],
          }),
        },
      },
    })
    movie: Omit<Movie, 'id'>,
  ): Promise<Movie> {
    if (this.sessionService.validToken(token))
      return this.movieRepository.create(movie);
    else throw new HttpErrors[401]("Session expired invalid token");
  }

  @get('/movies')
  @response(200, {
    description: 'Array of Movie model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Movie, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Movie) filter?: Filter<Movie>,
  ): Promise<Movie[]> {
    return this.movieRepository.find(filter);
  }

  @patch('/movies')
  @response(200, {
    description: 'Movie PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Movie, {partial: true}),
        },
      },
    })
    movie: Movie,
    @param.header.string('token') token: typeof User.prototype.token,
    @param.where(Movie) where?: Where<Movie>,
  ): Promise<Count> {
    if (this.sessionService.validToken(token))
      return this.movieRepository.updateAll(movie, where);
    else throw new HttpErrors[401]("Session expired invalid token");
  }

  @get('/movies/{id}')
  @response(200, {
    description: 'Movie model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Movie, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.header.string('token') token: typeof User.prototype.token,
    @param.path.number('id') id: number,
    @param.filter(Movie, {exclude: 'where'}) filter?: FilterExcludingWhere<Movie>
  ): Promise<Movie> {
    if (this.sessionService.validToken(token))
      return this.movieRepository.findById(id, filter);
    else throw new HttpErrors[401]("Session expired invalid token");
  }

  @patch('/movies/{id}')
  @response(204, {
    description: 'Movie PATCH success',
  })
  async updateById(
    @param.header.string('token') token: typeof User.prototype.token,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Movie, {partial: true}),
        },
      },
    })
    movie: Movie,
  ): Promise<void> {
    if (this.sessionService.validToken(token))
      await this.movieRepository.updateById(id, movie);
    else throw new HttpErrors[401]("Session expired invalid token");
  }

  @put('/movies/{id}')
  @response(204, {
    description: 'Movie PUT success',
  })
  async replaceById(
    @param.header.string('token') token: typeof User.prototype.token,
    @param.path.number('id') id: number,
    @requestBody() movie: Movie,
  ): Promise<void> {
    if (this.sessionService.validToken(token))
      await this.movieRepository.replaceById(id, movie);
    else throw new HttpErrors[401]("Session expired invalid token");
  }

  @del('/movies/{id}')
  @response(204, {
    description: 'Movie DELETE success',
  })
  async deleteById(
    @param.header.string('token') token: typeof User.prototype.token,
    @param.path.number('id') id: number
  ): Promise<void> {
    if (this.sessionService.validToken(token))
      await this.movieRepository.deleteById(id);
    else throw new HttpErrors[401]("Session expired invalid token");
  }
}
