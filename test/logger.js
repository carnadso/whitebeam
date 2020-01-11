const { expect } = require('chai');

const realStdout = process.stdout.write;
const realStderr = process.stderr.write;

let fakeStdoutLine = null;
let fakeStderrLine = null;

const fakeStdout = function (stuff) {
  fakeStdoutLine = stuff;
};
const fakeStderr = function (stuff) {
  fakeStderrLine = stuff;
};

const { logger } = require('../lib/index');
const defaultLogger = logger({ application: 'testRunner' });

describe('Logger', function () {
  beforeEach(() => {
    process.stdout.write = realStdout;
    process.env.NODE_ENV = 'test';
    fakeStdoutLine = null;
    fakeStderrLine = null;
  });

  afterEach(() => {
    process.stdout.write = realStdout;
  });

  it('should expose a Winston instance', () => {
    expect(defaultLogger.winston).to.be.an('object');
  });

  it('should expose an info level', () => {
    expect(defaultLogger.info).to.be.a('function');
  });

  it('should log a message at the info level on the default logger', () => {
    process.stdout.write = fakeStdout;
    defaultLogger.info('stuffy stuffs');
    process.stdout.write = realStdout;

    const output = JSON.parse(fakeStdoutLine);

    expect(output.message).to.equal('stuffy stuffs');
    expect(output.label).to.equal('default');
    expect(output.level).to.equal('info');
  });

  it('should log a message at the warn level on the default logger', () => {
    process.stdout.write = fakeStdout;
    defaultLogger.warn('stuffy stuffs');
    process.stdout.write = realStdout;

    const output = JSON.parse(fakeStdoutLine);

    expect(output.message).to.equal('stuffy stuffs');
    expect(output.label).to.equal('default');
    expect(output.level).to.equal('warn');
  });

  it('should be able to create a named logger and persist it', () => {
    const namedLogger = defaultLogger('namedLogger');
    expect(namedLogger).to.be.an('object');
    expect(namedLogger).to.equal(defaultLogger('namedLogger'));
  });

  it('should not expose metadata if requested as such', () => {
    process.env.NODE_ENV = 'development';
    process.stdout.write = fakeStdout;

    const skipMetaLogger = defaultLogger('skipMeta', { meta: false });
    skipMetaLogger.info('stuffy stuffs', { meta: 'stuffs' });

    process.stdout.write = realStdout;
    process.env.NODE_ENV = 'test';

    expect(fakeStdoutLine.indexOf('"meta"')).to.equal(-1);
  });

  it('should not log secrets', () => {
    process.stdout.write = fakeStdout;
    defaultLogger.info('secrets and passwords in the metadata', {
      secret: 'purple',
      password: 'rain',
      repeat_password: 'purple_rain',
    });
    process.stdout.write = realStdout;

    const output = JSON.parse(fakeStdoutLine);

    expect(output.secret).to.not.equal('purple');
    expect(output.password).to.not.equal('rain');
    expect(output.repeat_password).to.not.equal('purple_rain');
  });

  it('should log errors if provided as the only argument', () => {
    process.stdout.write = fakeStdout;
    try {
      throw new Error('so bad');
    } catch (err) {
      defaultLogger.error(err);
    }
    process.stdout.write = realStdout;

    const output = JSON.parse(fakeStdoutLine);
    expect(output.stack).to.be.an('array');
    expect(output.message).to.equal('so bad');
  });

  it('should log errors if provided as the second argument', () => {
    process.stdout.write = fakeStdout;
    try {
      throw new Error('so bad');
    } catch (err) {
      defaultLogger.error('very bad indeed', err);
    }
    process.stdout.write = realStdout;

    const output = JSON.parse(fakeStdoutLine);
    expect(output.stack).to.be.an('array');
    expect(output.message).to.equal('very bad indeed');
    expect(output.err_message).to.equal('so bad');
  });
});
