import {Dependency} from './dependency';
import {IInstance} from './i-instance';

export class ConstructorDependency extends Dependency {
  protected instantiate(): IInstance {
    return new this.source(...this.getDependencyInstances());
  }
}
