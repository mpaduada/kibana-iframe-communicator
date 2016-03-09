import exampleRoute from './server/routes/example';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],

    uiExports: {
      app: {
        title: 'Kibana Iframe Communicator Plugin',
        description: 'A kibana plugin that exposes kibana internals so when kibana is hosted inside an IFrame - an outside application can easliy communicate with kibana internals',
        main: 'plugins/kibana_iframe_communicator_plugin/app'
      },
      hacks: [
        'plugins/kibana_iframe_communicator_plugin/hack'
      ]
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init(server, options) {
      // Add server routes and initalize the plugin here
      exampleRoute(server);
    }

  });
};
