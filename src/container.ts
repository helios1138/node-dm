export class Container {
  private instances: Promise<any>[] = [];
  private classes: Function[];

  constructor() {
    console.log(this.instances);
  }

  public registerClass(constructor: Function): void {
    this.classes.push(constructor);
  }

  public getInstances(classes: Function[]): any[] {
    return [];
  }
}
