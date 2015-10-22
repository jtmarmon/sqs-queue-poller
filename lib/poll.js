import AWS from 'aws-sdk';
import _ from 'underscore';
import promisify from 'es6-promisify';

export default class SQSPoller {
  constructor({config, receiveMessageOptions}, cb) {
    this._config = config;
    _.extend(AWS.config, config);
    this._sqs = new AWS.SQS();
    this._receiveMessageOptions = receiveMessageOptions;
    this._cb = cb;
    this._isPolling = false;
    this._receiveMessage = promisify(this._sqs.receiveMessage.bind(this._sqs));
    this._deleteMessage = promisify(this._sqs.deleteMessage.bind(this._sqs));
  }

  async pull() {
    let data = await this._receiveMessage(this._receiveMessageOptions);
    if (!data.Messages) {
      // No messages in queue (means we timed out of long polling). poll again
      return;
    }

    this._cb(data);
  }

  async deleteMany(handles) {
    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];
      const deleteParams = {QueueUrl: this._receiveMessageOptions.QueueUrl, ReceiptHandle: handle};
      return await this._deleteMessage(deleteParams);
    }
  }

  async poll(promise) {
    this._isPolling = true;
    const self = this;
    if (promise) {
      await promise;
      return self.pull();
    }

    this.poll(await this.pull());
  }

  start() {
    if (this._isPolling === false) {
      this.poll();
      return true;
    }
    return false;
  }
}
