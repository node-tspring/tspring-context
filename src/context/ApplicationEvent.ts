export class ApplicationEvent {
  protected source: Object
  private timestamp: number

  constructor(source: Object) {
		this.source = source
		this.timestamp = new Date().getMilliseconds()
  }

  getSource() {
    return this.source
  }
}
