import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {Keys} from '../keys';
import {User, UserRelations, Credentials} from '../models';

@injectable({scope: BindingScope.TRANSIENT})
export class SessionService {
  constructor(/* Add @inject to inject parameters */) {}

  encryptPassword(user: User) : string {
    return bcrypt.hashSync(user.password, 8);
  }

  generateToken(user: User) : string {
    return jwt.sign({
      exp: Keys.tokenExpirationTime,
      data: {
        id: user.id,
        email: user.email,
      }
    }, Keys.jwtKey);
  }

  validateCredentials(credentials: Credentials, user: User & UserRelations) : boolean {
    return bcrypt.compareSync(credentials.password, user.password);
  }

  validToken(token: string) : boolean {
    try {
      jwt.verify(token, Keys.jwtKey);
    } catch (e) {
      return false;
    }
    return true;
  }
}
