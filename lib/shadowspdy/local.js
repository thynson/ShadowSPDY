// Generated by CoffeeScript 1.7.1
(function() {
  var fs, net, socket, spdy;

  fs = require('fs');

  net = require('net');

  spdy = require('spdy');

  socket = net.connect({
    port: 8488
  }, function() {
    var connection, headers, state, stream;
    connection = new spdy.Connection(socket, {
      isServer: false
    });
    connection._setVersion(3.1);
    connection.on('error', function(err) {
      return console.error(err);
    });
    stream = new spdy.Stream(connection, {
      id: 1,
      priority: 7
    });
    headers = {};
    state = stream._spdyState;
    connection._lock(function() {
      return state.framer.streamFrame(state.id, 0, {
        priority: 7
      }, headers, function(err, frame) {
        if (err) {
          connection._unlock();
          return self.emit('error', err);
        }
        connection.write(frame);
        connection._unlock();
        connection._addStream(stream);
        stream.emit('_spdyRequest');
        return state.initialized = true;
      });
    });
    stream.on('error', function(err) {
      return console.error(err);
    });
    stream.on('data', function(data) {
      return console.log(data.toString('binary'));
    });
    stream.on('end', function() {
      stream.end();
      return console.log('end');
    });
    stream.on('close', function() {
      console.log('close');
      return stream.close();
    });
    return stream.write('hi!\n');
  });

}).call(this);