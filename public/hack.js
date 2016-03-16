import $ from 'jquery';
import uiModules from 'ui/modules';
import 'ui/courier';
import rison from 'ui/utils/rison';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';


/*// hook into angular's application lifecycle example
uiModules.get('kibana').run(function ($rootScope, $location) {
    // attempt to inject the control every time the route changes or updates
  $rootScope.$on('$routeChangeSuccess', injectControl);
  $rootScope.$on('$routeUpdate', injectControlB);

  function injectControl() {
    console.log("$routeChangeSuccess");
    console.log($location.url());
  }
  function injectControlB() {
    console.log("$routeUpdate");
    console.log($location.url());
  }
});*/


// hook into dashboard kibana lifecycle
uiModules.get('app/dashboard', ['kibana/courier','ngRoute']).run(function ($rootScope, Private, $location, courier, $route, kbnUrl, getAppState, globalState, timefilter) {
  
  
    // parses url
    function getQueryVariable(variable, query) {        
        let vars = query.split('&');
        for (let i = 0; i < vars.length; i++) {
            let pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
        console.log('Query variable %s not found', variable);
    }
    
    let doNotSendRouteChangeNotificationToParent = false;
  
    //const queryFilter = Private(FilterBarQueryFilterProvider);
  
    // Create IE + others compatible message event handler
    let eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    let eventer = window[eventMethod];
    let messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

    // Listen to message from parent (or any other) window
    eventer(messageEvent,function(e) {
        console.log('received message!:  ',e.data);        
        
        let splitMsg = e.data.split('###');
        if(splitMsg.length != 2)
        {
            console.warn("Invalid message!");
            return;
        }
        let topic = splitMsg[0];
        let urlData = splitMsg[1];
        let indexOfDashSign, finalUri;
        
        switch(topic)
        {
            case "searchRequest": // in case we got a search request:
                console.log("Search request...")       
                // parse the app + global states:
                let passedInAppState = rison.decode(decodeURIComponent(getQueryVariable("_a", urlData)));
                let passedInGlobalState = rison.decode(decodeURIComponent(getQueryVariable("_g", urlData)));  
                
                // get the local kibana app + global states:
                let localAppState = getAppState(); 
                let localGlobalState = globalState; 
            
                // and now lets apply the filters:                
                localAppState.query.query_string.query = passedInAppState.query.query_string.query;
                //localGlobalState
                localGlobalState.time.from = passedInGlobalState.time.from;
                localGlobalState.time.mode = passedInGlobalState.time.mode;
                localGlobalState.time.to = passedInGlobalState.time.to;  
                // timefilter:
                timefilter.time.from = passedInGlobalState.time.from;
                timefilter.time.mode = passedInGlobalState.time.mode;
                timefilter.time.to = passedInGlobalState.time.to;
                
                indexOfDashSign =  urlData.indexOf("#");
                finalUri =   urlData.substr(indexOfDashSign+1);
                // update the url to correctly reflect new state (this will update the time filter and search bar in the UI):
                
                doNotSendRouteChangeNotificationToParent = true; // we do not want to send to our parent of the change (as he was the one who iniated this...)
                
                $location.url(finalUri);
                
                // go and get the data with the new filters:
                courier.fetch();
                
                // now we can re-listen and notify of INTERNAL changes:
                setTimeout(() => {doNotSendRouteChangeNotificationToParent = false;}, 1000);
                       
                return;
            case "routeRequest": // in case we were requsted to route to a different area:  
                
                console.log("Route request...");       
                indexOfDashSign =  urlData.indexOf("#");
                finalUri =   urlData.substr(indexOfDashSign+1);
                doNotSendRouteChangeNotificationToParent = true; // we do not want to send to our parent of the change (as he was the one who iniated this...)
                kbnUrl.change(finalUri);
                // now we can re-listen and notify of INTERNAL changes:
                setTimeout(() => {doNotSendRouteChangeNotificationToParent = false;}, 1000);
                return;
        }
        
        
       console.warn("Invalid message topic " + topic + "!");
        
        
        
    },false);
    
    
    $rootScope.$on('$routeUpdate', () => // on route updates
    {
        if(parent && !doNotSendRouteChangeNotificationToParent) // if we are truly hosted in an iframe
        {
            // update parent with current updated url data:
            parent.postMessage("kibanaUpdateNotification###" + $location.url() , "*")
        }
    });
  
  // example of how to hook to general key events:
  /*$(document.body).on('keypress', function (event) {
    if (event.which === 58) {
        //alert(document.location);
       
        let state = getAppState(); 
        let global = globalState; 


        let prompt = window.prompt("Change uri", $location.url());
        if (prompt != null)
        {
            $location.url(prompt);             
        }
        prompt = window.prompt("filter part","");
        state.query.query_string.query = prompt;
        
        courier.fetch();
        return;
        
        prompt = window.prompt("Change uri", $location.url());

        if (prompt != null && prompt != $location.url()) {
            //$location.url(prompt);
            
                   
            debugger;
            kbnUrl.change(prompt);            
        }                
        return;
        const filters = queryFilter.getFilters();
        console.log(JSON.stringify(filters))
        const dash = $route.current.locals.dash;
        debugger;
        dash.searchSource.set('filter', filters);        
        courier.fetch();
    }
    });
  */
  
  
});

