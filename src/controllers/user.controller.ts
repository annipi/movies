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
import {User, Credentials} from '../models';
import {UserRepository, MovieRepository} from '../repositories';
import {service} from '@loopback/core';
import {SessionService} from '../services';

const httpErrorSchema = {
  type: 'object',
  title: 'HttpError',
  properties: {
    error: {
      properties: {
        statusCode: {type: 'number'},
        name: {type: 'string'},
        message: {type: 'string'}
      }
    }
  }
};

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository : UserRepository,
    @repository(MovieRepository)
    public movieRepository : MovieRepository,
    @service(SessionService)
    public sessionService : SessionService,
  ) {}

  @post('/register')
  @response(200, {
    description: 'User registered successfully',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['id'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    user.password = this.sessionService.encryptPassword(user);
    return this.userRepository.create(user);
  }

  @get('/users/count')
  @response(200, {
    description: 'User count returned successfully',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
  ): Promise<void> {
    await this.userRepository.updateById(id, user);
  }

  @put('/users/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() user: User,
  ): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }

  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userRepository.deleteById(id);
  }

  @post('/login', {
    responses: {
      "200": {
        description: 'Correct credentials access to the server for 20 min',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              title: 'Credentials',
              properties: {
                email: { type: 'string' },
                token: { type: 'string' }
              }
            }
          }
        },
      },
      "404": {
        description: 'The given password does not match with the email',
        content: { 'application/json': { schema: httpErrorSchema } },
      },
      "401": {
        description: 'The given email was not found on the database',
        content: { 'application/json': { schema: httpErrorSchema } },
      },
    }
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'Credential',
            properties: {
              email: {type: 'string'},
              password: {type: 'string'}
            }
          }
        },
      },
    }) credentials: Credentials
  ): Promise<object> {
    const user = await this.userRepository
      .findOne({ where: { email: credentials.email } });
    if(user) {
      const validCredentials = this.sessionService.validateCredentials(credentials, user);
      if(validCredentials) {
        const token = this.sessionService.generateToken(user);
        user.token = token;
        await this.userRepository.updateById(user.id, user);
        return {
          email: credentials.email,
          token,
        };
      } else throw new HttpErrors[401]("Password is invalid");
    } else throw new HttpErrors[404]("Email not registered");
  }
}
