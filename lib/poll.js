import AWS from 'aws-sdk';
const sqs = new AWS.SQS();
import co from 'co';
import promisify from 'es6-promisify';
const receiveMessage = promisify(sqs.receiveMessage.bind(sqs));
const deleteMessage = promisify(sqs.deleteMessage.bind(sqs));

export default class SQSPoller {
  constructor({config, receiveMessageOptions}, cb) {
    this._config = config;
    this._receiveMessageOptions = receiveMessageOptions;
    this._cb = cb;
  }

  * poll() {
    let data = yield receiveMessage(this._receiveMessageOptions);
    if (!data.Messages) {
      // No messages in queue (means we timed out of long polling). poll again
      return;
    }

    this._cb(messages);
  }

  * delete(handle) {
    let deleteParams = {QueueUrl: ReceiptHandle.QueueUrl, ReceiptHandle: handle};
    return yield deleteMessage(deleteParams);
  }

  start() {
    var doPolling = function(promise) {
      promise
      .catch(err => {
        throw err
      })
      .then(() => {
        return doPolling(co(poll));
      });
    };

    doPolling(co(poll));
  }
}
