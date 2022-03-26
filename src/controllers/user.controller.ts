/* eslint @typescript-eslint/naming-convention: 0 */
import {repository} from '@loopback/repository';
import {
  post,
  getModelSchemaRef,
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
        message: {type: 'string'},
      },
    },
  },
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

  @post('/register', {
    responses: {
      '200': {
        description: 'User registered successfully',
        content: {'application/json': {schema: getModelSchemaRef(User)}},
      },
      '400': {
        description: 'Some of the values of the request are not valid',
        content: { 'application/json': { schema: httpErrorSchema } },
      },
      '409': {
        description: 'Conflict with the actual state of the server',
        content: { 'application/json': { schema: httpErrorSchema } },
      },
    },
  })
  @response(200 )
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['id', 'token'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    if (!user.email.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ))
      throw new HttpErrors[400]('Not valid email address');
    if(await this.userRepository.findOne({ where: { email: user.email } })) {
      throw new HttpErrors[409]('The email address already exists');
    }
    if(this.invalidPassword(user.password))
      throw new HttpErrors[400]('Password must contains at least 10' +
        'characters, one lower case letter, one uppercase letter and one of' +
        'the following characters !, @, #, ?, ]');
    user.password = this.sessionService.encryptPassword(user);
    return this.userRepository.create(user);
  }

  @post('/login', {
    responses: {
      '200': {
        description: 'Correct credentials access to the server for 20 min',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              title: 'Credentials',
              properties: {
                token: { type: 'string' },
              },
            },
          },
        },
      },
      '401': {
        description: 'The given email was not found on the database',
        content: { 'application/json': { schema: httpErrorSchema } },
      },
      '400': {
        description: 'Some of the values of the request are not valid',
        content: { 'application/json': { schema: httpErrorSchema } },
      },
      '404': {
        description: 'The given password does not match with the email',
        content: { 'application/json': { schema: httpErrorSchema } },
      },
    },
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
              password: {type: 'string'},
            },
          },
        },
      },
    }) credentials: Credentials,
  ): Promise<object> {
    if(!credentials.email.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ))
      throw new HttpErrors[400]('Not valid email address');
    if(this.invalidPassword(credentials.password))
      throw new HttpErrors[400]('Password must contains at least 10 characters');
    const user = await this.userRepository
      .findOne({ where: { email: credentials.email } });
    if(user) {
      const validCredentials = this.sessionService.validateCredentials(credentials, user);
      if(validCredentials) {
        const token = this.sessionService.generateToken(user);
        user.token = token;
        await this.userRepository.updateById(user.id, user);
        return { token };
      } else throw new HttpErrors[401]('Password is invalid');
    } else throw new HttpErrors[404]('Email not registered');
  }

  invalidPassword(pwd: string) : boolean {
    return (pwd.length < 10)
      || (!pwd.match(/.*[A-Z]+.*/))
      || (!pwd.match(/.*[a-z]+.*/))
      || (!pwd.match(/.*[!@\]#?]+.*/));
  }
}
