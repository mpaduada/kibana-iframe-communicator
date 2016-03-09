export default function (server) {

  server.route({
    path: '/api/kibana_iframe_communicator_plugin/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: (new Date()).toISOString() });
    }
  });

};
