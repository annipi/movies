import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDatasource} from '../datasources';
import {Movie, MovieRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class MovieRepository extends DefaultCrudRepository<
  Movie,
  typeof Movie.prototype.id,
  MovieRelations
> {

  public readonly user: BelongsToAccessor<User, typeof Movie.prototype.id>;

  constructor(@inject('datasources.db') dataSource: DbDatasource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,) {
    super(Movie, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  findPublic() : Promise<Movie[]>{
    return this.find({ where: { isPublic: true } });
  }
}
