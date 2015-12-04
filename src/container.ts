import {Dependency} from './dependency';
import {ISource} from './i-source';

export class Container {
  protected dependencies: Dependency[] = [];

  public registerDependency(dependency: Dependency): void {
    this.dependencies.push(dependency);
  }

  public getDependencyInstance(source: ISource): any {
    return this.getDependency(source).instance;
  }

  protected getDependency(source: ISource): Dependency {
    let dependency: Dependency = null;

    for (let i: number = 0; i < this.dependencies.length; i++) {
      if (this.dependencies[i].isSource(source)) {
        dependency = this.dependencies[i];
        break;
      }
    }

    return dependency;
  }
}
