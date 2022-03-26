import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDatasource} from '../datasources';
import {User, UserRelations} from '../models';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {

  constructor(@inject('datasources.db') dataSource: DbDatasource) {
    super(User, dataSource);
  }

  findUserByToken(token: string) : Promise<User | null> {
    return this.findOne({ where: { token: token }});
  }
}
