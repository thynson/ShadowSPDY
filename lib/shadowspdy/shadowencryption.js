// Generated by CoffeeScript 1.7.1
(function() {
  var DuplexStream, EVP_BytesToKey, ShadowStream, bytes_to_key_results, crypto, int32Max, method_supported, stream, test, tls, util;

  crypto = require("crypto");

  tls = require("tls");

  util = require("util");

  stream = require('stream');

  int32Max = Math.pow(2, 32);

  bytes_to_key_results = {};

  EVP_BytesToKey = function(password, key_len, iv_len) {
    var count, d, data, i, iv, key, m, md5, ms;
    if (bytes_to_key_results[password]) {
      return bytes_to_key_results[password];
    }
    m = [];
    i = 0;
    count = 0;
    while (count < key_len + iv_len) {
      md5 = crypto.createHash('md5');
      data = password;
      if (i > 0) {
        data = Buffer.concat([m[i - 1], password]);
      }
      md5.update(data);
      d = to_buffer(md5.digest());
      m.push(d);
      count += d.length;
      i += 1;
    }
    ms = Buffer.concat(m);
    key = ms.slice(0, key_len);
    iv = ms.slice(key_len, key_len + iv_len);
    bytes_to_key_results[password] = [key, iv];
    return [key, iv];
  };

  method_supported = {
    'aes-128-cfb': [16, 16],
    'aes-192-cfb': [24, 16],
    'aes-256-cfb': [32, 16],
    'bf-cfb': [16, 8],
    'camellia-128-cfb': [16, 16],
    'camellia-192-cfb': [24, 16],
    'camellia-256-cfb': [32, 16],
    'cast5-cfb': [16, 8],
    'des-cfb': [8, 8],
    'idea-cfb': [16, 8],
    'rc2-cfb': [16, 8],
    'rc4': [16, 0],
    'seed-cfb': [16, 16]
  };

  DuplexStream = stream.Duplex;

  ShadowStream = function(source, method, password) {
    var self;
    DuplexStream.call(this);
    if (!(method in method_supported)) {
      throw new Error("method " + method + " not supported");
    }
    this._source = source;
    this._method = method;
    this._password = password;
    this._sendState = 0;
    this._receiveState = 0;
    this._sendIV = new Buffer(32);
    this._receiveIV = new Buffer(32);
    this.timeout = source.timeout;
    self = this;
    source.on('connect', function() {
      return self.emit('connect');
    });
    source.on('end', function() {
      console.log('source on end');
      return self.push(null);
    });
    source.on('readable', function() {
      console.log('source on readable');
      return self.read(0);
    });
    source.on('error', function(err) {
      return self.emit('error', err);
    });
    source.on('timeout', function() {
      return self.emit('timeout');
    });
    source.on('close', function() {
      return self.emit('close');
    });
    return this;
  };

  util.inherits(ShadowStream, DuplexStream);

  ShadowStream.prototype._read = function(bytes) {
    var chunk;
    console.log('_read');
    chunk = this._source.read();
    console.log(chunk);
    if (chunk === null) {
      return this.push('');
    }
    return this.push(chunk);
  };

  ShadowStream.prototype._write = function(chunk, encoding, callback) {
    console.log('_write');
    console.log(chunk);
    if (chunk instanceof String) {
      chunk = new Buffer(chunk, encoding);
    }
    this._source.write(chunk);
    return callback();
  };

  ShadowStream.prototype.end = function(data) {
    return this._source.end(data);
  };

  ShadowStream.prototype.destroy = function() {
    return this._source.destroy();
  };

  exports.ShadowStream = ShadowStream;

  test = function() {
    var cli, net, server;
    net = require('net');
    server = net.createServer(function(conn) {
      var s;
      s = new ShadowStream(conn, 'aes-256-cfb', 'foobar');
      s.on('data', function(data) {
        return console.log(data.toString());
      });
      return s.on('end', function() {
        console.log('server end');
        s.end();
        return server.close();
      });
    });
    server.listen(8888);
    cli = net.connect(8888, 'localhost', function() {
      var s;
      s = new ShadowStream(cli, 'aes-256-cfb', 'foobar');
      s.write('hello');
      return s.end('world');
    });
    return cli.on('end', function() {
      console.log('cli end');
      return cli.end();
    });
  };

  test();

}).call(this);