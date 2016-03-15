# kibana_iframe_communicator_plugin

> A kibana plugin that exposes kibana internals so when kibana is hosted inside an IFrame - an outside application can easliy communicate with kibana internals

---

## Plugin Installation

Easy install of plugin by running (from the kibana install folder):
bin/kibana plugin -i traffic_light_vis -u https://github.com/bondib/kibana-iframe-communicator-plugin/archive/master.zip

## development

See the [kibana contributing guide](https://github.com/elastic/kibana/blob/master/CONTRIBUTING.md) for instructions setting up your development environment. Once you have completed that, use the following npm tasks.

<dl>
  <dt><code>npm start</code></dt>
  <dd>Start kibana and have it include this plugin</dd>

  <dt><code>npm run build</code></dt>
  <dd>Build a distributable archive</dd>

  <dt><code>npm run test:browser</code></dt>
  <dd>Run the browser tests in a real web browser</dd>

  <dt><code>npm run test:server</code></dt>
  <dd>Run the server tests using mocha</dd>
</dl>

For more information about any of these commands run `npm run ${task} -- --help`.
