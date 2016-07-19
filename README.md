# kibana_iframe_communicator_plugin

> A kibana plugin that exposes kibana internals so when kibana is hosted inside an IFrame - an outside application can easily communicate with kibana internals

---

## Plugin Installation

Easy install of plugin by running (from the kibana install folder):
bin/kibana plugin -i iframe_communicator_plugin -u https://github.com/bondib/kibana-iframe-communicator-plugin/archive/master.zip

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


## How To Work With This Plugin?

Let's start with a disclaimer - this plugin was build to quickly enable communication (as a temporary solution) between an external app hosting kibana in an embedded mode inside an IFrame and Kibana, so we won't have the refresh the IFrame page on every change triggered by the hosting app. Therefore this code could (or should...) be structured much better, but it's good enough to get started with &#X1f60a


## Background

So first we need to host a kibana dashboard in an embeded mode. This could be done using Kibana's sharing feature. (please see https://www.elastic.co/guide/en/kibana/current/dashboard.html#sharing-dashboards)

In this mode (make sure "embed" is part of the url query string), only the contents of the dashboard is visible. All of its management capabilities (like adding or removing a dashboard) are not visible - and that's is eaxtly what we wanted - as we just wanted to present the dashboard content to our users.
The thing is, the date range picker and the serach bar get removed as well. So in our application we added our own date range picker and search bar as we wanted to enable the user to filter and view the dashboard with different date ranges.

So if you look at the embed link of kibana it looks something like the following:
http://{KIBANA-HOST}/app/kibana#/dashboard/{OPTIONAL-DASHBOARD-NAME}?embed&_g={GLOBAL-STATE-DATA}&_a={APP-STATE-DATA}

The OPTIONAL-DASHBOARD-NAME should not be used in my opinion - as it's truly not necessary as all of the dashboard content is already embedded in the url data (and if one day you rename the dashboard, it will stop working when you try to load the page).
Once again, the "embed" is what makes the KIBANA wrapping (the management part of the dashboard) to disappear - and leave only the content of the dashboard.

A very nice and interesting approach kibana developers took (in order to share a dashboard by using just a URL) is that they save the contents of the dashboard in the url as well as as any filters the user requested and some other stuff.
They do this by using RISON (https://www.npmjs.com/package/rison) - which basically takes any JS object and serializes it to a format similar to JSON but instead optimized for compactness in URIs.
So the first step of manipulating the data, is to to take the GLOBAL-STATE-DATA and APP-STATE-DATA and convert it back to JS.
Then you can manipulate what ever you want in there - and when done - serialize it back to the url (again using RISON) and set it back as the iframe url.

I'm not going into explaining GLOBAL-STATE-DATA and APP-STATE-DATA, but the easiest way to understand what it contains - it to go to kibana and view some dashboard.
Then modify the time filter (notice they have a few modes there - including relative, absolute and quick), the query, the auto refresh interval and see how the url gets modified.

So now, that we understand how to change the dashboard state and how to initially load an iframe with a kibana dashboard in an emended mode - let's move.


# The Plugin


So instead of each time refreshing the complete iframe (by modifying the url and reloading the IFrame) - we developed a plugin so you can send the uri data directly to the kibana hosted in your IFrame.
So in order to properly communicate with the IFrame we use the window.postMessage method. (https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)


As the postMessage method accepts a message string object, and as we needed to easily send different instructions in, we structured the message as following:
 <dt>{ACTION-TYPE}###{UPDATED-IFRAME-URL}</dt>

In the plugin we currently support two types of actions:

1). <code>routeRequest</code> - switch to a different route inside the kibana web app
2). <code>searchRequest</code> - internally refresh current displayed dashboard with the provided data

So assuming myIframe is the IFrame DOM element, you can now ask kibana to switch to a different dashboard by invoking:

 <dt><code>myIframe.contentWindow.postMessage('routeRequest###' + this.iframeFinalUrl, '*');</code></dt>


And if you just want to change the filter of a current displayed dashboard (and not to completely switch to a different dashboard) you can invoke:

<dt><code>myIframe.contentWindow.postMessage('searchRequest###' + this.iframeFinalUrl, '*');</code></dt>

<code>this.iframeFinalUrl</code> is your kibana URI containing the complete dashboard data such as:
http://{KIBANA-HOST}/app/kibana#/dashboard/{OPTIONAL-DASHBOARD-NAME}?embed&_g={GLOBAL-STATE-DATA}&_a={APP-STATE-DATA}


AS WELL, the kibana plugin notifies back to its host (your html page hosting the kibana IFrame) - when loading is done.
You can register using the <code>onmessage</code> or <code>message</code> event and listen to this notification.
The messages from the plugin are formatted the same way ( <code>{ACTION-TYPE}###{UPDATED-IFRAME-URL}</code>).

Currently, the only message that is sent from the plugin:

1). <code>kibanaUpdateNotification</code> -  when kibana finished updating according to a previous change request


Usage Example:

<code>
 // Create IE + others compatible message event handler to listen to internal iframe updates:
        let eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        let eventer = window[eventMethod];
        let messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
        
        eventer(messageEvent,(e) => {
            console.log('iframe-visulaization, received message!:  ',e.data); 
            // parse message:     
            let splitMsg = e.data.split('###');
            if(splitMsg.length != 2)
            {
                console.warn("Invalid message!");
                return;
            }
            let topic = splitMsg[0];
            let urlData = splitMsg[1];  
            
            if(topic == "kibanaUpdateNotification")
            {
                let indexOfDashSign = this.settings.url.indexOf("#") + 1;
                this.settings.url = this.settings.url.substr(0, indexOfDashSign) + urlData;
                console.log("Updated this.settings.url to \"" + this.settings.url  + "\"");
                
                // now, that the settings uri is updated with the changes - let's notify parent of the changes done as well (so he can display the updated date filter as well if such was changed)                
                let globalStateSTR = Helpers.getQueryVariable("_g", this.settings.url); // the kibana global state obj
                let appStateSTR = Helpers.getQueryVariable("_a", this.settings.url);    // the kibana app state obj          
                let globalStateOBJ = Rison.decode(globalStateSTR);
                let appStateOBJ = Rison.decode(appStateSTR);
                // update app and global var with updated user's search filters...
            } 
        });
</code>



I hope this is enough to get you started.
Thanks and good luck!
Benjamin Bondi


