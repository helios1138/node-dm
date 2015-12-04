import {Dependency} from './dependency';
import {IInstance} from './i-instance';

export class FactoryDependency extends Dependency {
  protected instantiate(): IInstance {
    return this.source(...this.getDependencyInstances());
  }
}
