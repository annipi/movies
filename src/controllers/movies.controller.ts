/* eslint @typescript-eslint/naming-convention: 0 */
import {
  Filter,
  repository,
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
import {MovieRepository, UserRepository} from '../repositories';
import {SessionService} from '../services';
import {service} from '@loopback/core';

const httpErrorSchema = {
  type: 'object',
  title: 'HttpError',
  properties: {
    error: {
      properties: {
        statusCode: {type: 'number'},
        name: {type: 'string'},
        message: {type: 'string'},
      },
    },
  },
};

export class MoviesController {
  constructor(
    @repository(MovieRepository)
    public movieRepository : MovieRepository,
    @repository(UserRepository)
    public userRepository : UserRepository,
    @service(SessionService)
    public sessionService : SessionService,
  ) {}

  @post('/movies', {
    responses: {
      '200': {
        description: 'Successfully created new movie',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Movie, {
              title: 'MovieCreated',
              exclude: ['isPublic'],
            }),
          },
        },
      },
      '401': {
        description: 'The given token has expired',
        content: { 'application/json': { schema: httpErrorSchema } },
      },
    },
  })
  async create(
    @param.header.string('token') token: typeof User.prototype.token,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Movie, {
            title: 'NewMovie',
            exclude: ['id', 'userId', 'isPublic'],
          }),
        },
      },
    })
    movie: Omit<Movie, 'id'>,
  ): Promise<Movie> {
    if(token) {
      movie.isPublic = false;
      const logInUser = await this.userRepository.findUserByToken(token);
      if(logInUser?.id) movie.userId = logInUser.id;
      if (this.sessionService.validToken(token))
        return this.movieRepository.create(movie);
      else throw new HttpErrors[401]('Session expired invalid token');
    } else throw new HttpErrors[401]('you must provide a token in to add new movies');
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
    @param.header.string('token') token?: typeof User.prototype.token,
    @param.filter(Movie) filter?: Filter<Movie>,
  ): Promise<Movie[]> {
    const publicMovies = await this.movieRepository.findPublic();
    if(token) {
      const logInUser = await this.userRepository.findUserByToken(token);
      if (logInUser) {
        return this.movieRepository.find();
      } else return publicMovies;
    }
    return publicMovies;
  }

  @patch('/movies/{id}', {
    responses: {
      '200': {
        description: 'Successfully deleted movie with id',
      },
      '401': {
        description: 'User not authorized',
        content: {'application/json': {schema: httpErrorSchema}},
      },
      '404': {
        description: 'Data not found',
        content: {'application/json': {schema: httpErrorSchema}},
      },
    },
  })
  async updateById(
    @param.header.string('token') token: typeof User.prototype.token,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Movie, {
            partial: true,
            title: 'MovieToChange',
            exclude: ['id', 'userId', 'isPublic'],
          }),
        },
      },
    })
    movie: Movie,
  ): Promise<void> {
    if (token) {
      const logInUser = await this.userRepository.findUserByToken(token);
      const movieById = await this.movieRepository.findById(id);
      if (!movieById) throw new HttpErrors[404]('Movie id does not exist');
      if (logInUser) {
        if (this.sessionService.validToken(token)) {
          if (logInUser.id === movieById.userId)
            await this.movieRepository.updateById(id, movie);
          else throw new HttpErrors[401]('You are not allowed to delete this movie');
        } else throw new HttpErrors[401]('Session expired invalid token');
      } else throw new HttpErrors[404]('User not found invalid token');
    } else throw new HttpErrors[401]('You must provide a token in to update a movie');
  }

  @del('/movies/{id}', {
    responses: {
      '200': {
        description: 'Successfully deleted movie with id',
      },
      '401': {
        description: 'User not authorized',
        content: {'application/json': {schema: httpErrorSchema}},
      },
      '404': {
        description: 'Data not found',
        content: {'application/json': {schema: httpErrorSchema}},
      },
    },
  })
  async deleteById(
    @param.header.string('token') token: typeof User.prototype.token,
    @param.path.number('id') id: number,
  ): Promise<void> {
    if (token) {
      const logInUser = await this.userRepository.findUserByToken(token);
      const movieById = await this.movieRepository.findById(id);
      if (!movieById) throw new HttpErrors[404]('Movie id does not exist');
      if (logInUser) {
        if (this.sessionService.validToken(token)) {
          if (logInUser.id === movieById.userId)
            await this.movieRepository.deleteById(id);
          else throw new HttpErrors[401]('You are not allowed to delete this movie');
        } else throw new HttpErrors[401]('Session expired invalid token');
      } else throw new HttpErrors[404]('User not found invalid token');
    } else throw new HttpErrors[401]('You must provide a token to delete a movie');
  }
}
