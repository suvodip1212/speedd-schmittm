app.factory('dataService', function ($rootScope,socket,$http) { // this service broadcasts all data items received from server --- controllers need to listen for 'broadcastRamps'
	var data = {};
	  
	data.selection;
	data.rawEventList=[];
	data.map_data;
	data.map_data2;
	data.countrySelection;
	
	data.userEvent;
	data.inTerms = "area";
	
	socket.on('event-list', function (socketData) {
			var events = JSON.parse(socketData.eventList);
			data.rawEventList=events;
//			console.log(data.rawEventList);
			data.broadcastRawEventList();
//			data.broadcastAllEvents(events);
	});
	
	
	socket.on('speedd-out-events', function (socketData) {
			var event = JSON.parse(socketData);
			data.rawEventList.push(event);
			data.parseEvent(event);
//			console.log(event);
//			console.log(data.rawEventList);
	});
	
	
	data.parseEvent = function(event){
		if (event.name == "FraudAtATM")
		{
			// decode country
			var country = data.map_data.get(data.getCountryCode(event.attributes.acquirer_country));
			// increment flagged
			country.financial.flagged[country.financial.flagged.length-1]++;
			// notify listeners of change
			data.broadcastFraudAtATM();
		}
		else if (event.name == "IncreasingAmounts")
		{
			// decode country
			var country = data.map_data.get(data.getCountryCode(event.attributes.acquirer_country));
			// increment flagged
			country.financial.flagged[country.financial.flagged.length-1]++;
			// notify listeners of change
			data.broadcastIncreasingAmounts();
		}
		else if (event.name == "Transaction")
		{
			data.broadcastTransaction();
		}
		else if (event.name == "TransactionStats")
		{
			// decode country
			var country = data.map_data.get(data.getCountryCode(event.attributes.country));
			// store amount and volume
			country.financial.amount.push(event.attributes.average_transaction_amount_eur);
			country.financial.volume.push(event.attributes.transaction_volume);
			// notify listeners of change
			data.broadcastTransactionStats();
		}
	};
	
	
	// function to convert country identifier from callingCode to cca2
	data.getCountryCode = function (callingCode){
		var cca;
//		console.log(callingCode);
		var c = data.map_data2.get(callingCode);
		
		cca = c.cca2;
//		console.log(cca);
		
		return cca;
	}
	
	data.broadcastAllEvents = function (eventList){
		for (var i = 0; i < eventList.length ; i++)
		{
			data.parseEvent(eventList[i]);
		}
	}
	
	$http.get('data/treemapcountries.json')
		.success(function(d, status, headers, config) {
			d.children.forEach(function (d) {
				d.financial = {};
				
				d.financial.amount = [10,5,1];
				d.financial.flagged = [5,95,1];
				d.financial.volume = [102,1058,1];
//					console.log(map_data.set(d.cca2, d))
//					countryProperties[d.cca2] = d;
			});
		  
		  data.map_data = d3.map(d.children, function(d){return d.cca2;});
		  data.map_data2 = d3.map(d.children, function(d){return d.callingCode;});
//		  console.log(data.map_data2.get(49).cca2);
		  data.broadcastMapCountriesData();
		  
		})
		.error(function(data, status, headers, config) {
		  // log error
		});
	
	
  data.changeSelection = function(obj){	//changes ramp selected based on rampList click (RampListController)
	data.selection = obj;
	data.broadcastSelectionChanged();
//	console.log(obj);
  };
  
  data.changeCountrySelection = function(obj){	//changes ramp selected based on rampList click (RampListController)
	data.countrySelection = obj;
	data.broadcastCountrySelectionChanged();
	console.log(data.countrySelection);
  };
  
  
  data.changeStatsClick = function(obj){
	data.inTerms = obj;
	data.broadcastStatsClick();
  }
/*  
  data.changeThresholdsRampSelected = function(lower,upper){	// changes rate thresholds of selected ramp ---- function called by "ChallengeModalController"
	data.rampList[data.rampSelected].limits.lowerLimit = (lower != undefined)? lower:"Auto";
	data.rampList[data.rampSelected].limits.upperLimit = (upper != undefined)? upper:"Auto";
	
	/////////////////////////////// SEND SOCKET EVENTS TO SERVER
	////////////////////////////////////////////////////////////
	var rampLocation = data.rampIdToLocation(data.rampSelected);
	// format the message
	var messageToSend = {
		"name": "setMeteringRateLimits",
		"timestamp": new Date().getTime(),	
		"attributes":
		{
			"location": rampLocation.location,
			"upperLimit": (upper != undefined)? upper:-1,
			"lowerLimit": (lower != undefined)? lower:-1
		}
	}
	// send the message
	socket.emit('speedd-out-events', JSON.stringify(messageToSend));
	// pushes the event to rawEventList
	data.rawEventList.push(messageToSend);
	// tells controllers(only EventListController for now) that user event has occurred
	data.broadcastUserEvent();
  };
*/
  data.broadcastSelectionChanged = function(){
	$rootScope.$broadcast('broadcastSelectionChanged');
  };
  
  data.broadcastCountrySelectionChanged = function(){
	$rootScope.$broadcast('broadcastCountrySelectionChanged');
  };
  
   data.broadcastStatsClick = function(){
	$rootScope.$broadcast('broadcastStatsClick');
  };
  
    data.broadcastMapCountriesData = function(){
	$rootScope.$broadcast('broadcastMapCountriesData');
  };
  
  data.broadcastRawEventList = function(){
	$rootScope.$broadcast('broadcastRawEventList');
  };

  data.broadcastFraudAtATM = function(){
	$rootScope.$broadcast('broadcastFraudAtATM');
  };
    
  data.broadcastIncreasingAmounts = function(){
	$rootScope.$broadcast('broadcastIncreasingAmounts');
  };
  
  data.broadcastTransaction = function(){
	$rootScope.$broadcast('broadcastTransaction');
  };
  data.broadcastTransactionStats = function(){
	$rootScope.$broadcast('broadcastTransactionStats');
  };

  return data;
});