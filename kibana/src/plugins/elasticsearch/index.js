'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _lodash = require('lodash');

var _boom = require('boom');

var _libHealth_check = require('./lib/health_check');

var _libHealth_check2 = _interopRequireDefault(_libHealth_check);

var _libExpose_client = require('./lib/expose_client');

var _libExpose_client2 = _interopRequireDefault(_libExpose_client);

var _libCreate_proxy = require('./lib/create_proxy');

var _libCreate_proxy2 = _interopRequireDefault(_libCreate_proxy);

module.exports = function (_ref) {
  var Plugin = _ref.Plugin;

  return new Plugin({
    require: ['kibana'],

    config: function config(Joi) {
      var array = Joi.array;
      var boolean = Joi.boolean;
      var number = Joi.number;
      var object = Joi.object;
      var string = Joi.string;

      return object({
        enabled: boolean()['default'](true),
        url: string().uri({ scheme: ['http', 'https'] })['default']('http://localhost:9200'),
        preserveHost: boolean()['default'](true),
        username: string(),
        password: string(),
        shardTimeout: number()['default'](0),
        requestTimeout: number()['default'](30000),
        pingTimeout: number()['default'](30000),
        startupTimeout: number()['default'](5000),
        ssl: object({
          verify: boolean()['default'](true),
          ca: array().single().items(string()),
          cert: string(),
          key: string()
        })['default'](),
        apiVersion: string()['default']('2.0'),
        engineVersion: string().valid('^2.3.0')['default']('^2.3.0')
      })['default']();
    },

    init: function init(server, options) {
      var kibanaIndex = server.config().get('kibana.index');

      // Expose the client to the server
      (0, _libExpose_client2['default'])(server);
      (0, _libCreate_proxy2['default'])(server, 'GET', '/{paths*}');
      (0, _libCreate_proxy2['default'])(server, 'POST', '/_mget');
      (0, _libCreate_proxy2['default'])(server, 'POST', '/{index}/_search');
      (0, _libCreate_proxy2['default'])(server, 'POST', '/{index}/_field_stats');
      (0, _libCreate_proxy2['default'])(server, 'POST', '/_msearch');
      (0, _libCreate_proxy2['default'])(server, 'POST', '/_search/scroll');

      function noBulkCheck(_ref2, reply) {
        var path = _ref2.path;

        if (/\/_bulk/.test(path)) {
          return reply({
            error: 'You can not send _bulk requests to this interface.'
          }).code(400).takeover();
        }
        return reply['continue']();
      }

      function noDirectIndex(_ref3, reply) {
        var path = _ref3.path;

        var requestPath = (0, _lodash.trimRight)((0, _lodash.trim)(path), '/');
        var matchPath = (0, _libCreate_proxy.createPath)(kibanaIndex);

        if (requestPath === matchPath) {
          return reply((0, _boom.methodNotAllowed)('You cannot modify the primary kibana index through this interface.'));
        }

        reply['continue']();
      }

      // These routes are actually used to deal with things such as managing
      // index patterns and advanced settings, but since hapi treats route
      // wildcards as zero-or-more, the routes also match the kibana index
      // itself. The client-side kibana code does not deal with creating nor
      // destroying the kibana index, so we limit that ability here.
      (0, _libCreate_proxy2['default'])(server, ['PUT', 'POST', 'DELETE'], '/' + kibanaIndex + '/{paths*}', {
        pre: [noDirectIndex, noBulkCheck]
      });

      // Set up the health check service and start it.

      var _healthCheck = (0, _libHealth_check2['default'])(this, server);

      var start = _healthCheck.start;
      var waitUntilReady = _healthCheck.waitUntilReady;

      server.expose('waitUntilReady', waitUntilReady);
      start();
    }
  });
};
