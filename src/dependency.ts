import {Container} from './container';
import {ISource} from './i-source';
import {IInstance} from './i-instance';

export class Dependency {
  protected instantiated: boolean = false;
  protected _instance: IInstance;

  constructor(protected container: Container,
              protected source: ISource,
              protected dependencySources: ISource[]) {}

  public isSource(source: ISource): boolean {
    return this.source === source;
  }

  public get instance(): IInstance {
    if (!this.instantiated) {
      this._instance = this.instantiate();
    }

    return this._instance;
  }

  protected getDependencyInstances(): IInstance[] {
    let instances: IInstance[] = [];

    for (let i: number = 0; i < this.dependencySources.length; i++) {
      instances.push(this.container.getDependencyInstance(this.dependencySources[i]));
    }

    return instances;
  }

  protected instantiate(): IInstance {
    throw new Error('not implemented');
  }
}
