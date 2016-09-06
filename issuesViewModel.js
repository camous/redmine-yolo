/* global apiKey */
/* global redmineBaseUri */
/* global $ */
var activityViewModel = function (data){
	var logs = ko.observableArray();
	var id = data.id;
	var color = data.color;
	var name = data.name;
	var sum = ko.computed(function (){
		var result = 0;
				
		ko.utils.arrayForEach( logs(), function (log) {
			result += log.hours;
		});
		return result;
	});
	
	return {
		logs: logs,
		id: id,
		color: color,
		name: name,
		sum: sum
	};
};

var issuesViewModel = function(){
	
	var chart = $('#container').highcharts();
	
	// 80% of time, times log are done the next day. 20% time for friday are done on monday.
	var bestDate = moment().isoWeekday() == 1 ? moment().subtract(3, "days") : moment().subtract(1, "days");  
	var date = ko.observable(bestDate.format('YYYY-MM-DD'));
	
	var query = ko.observable('');
	var projectId = ko.observable(''); 	// store the latest project id filtered, used when only one project is selected for adding times entries
	var projectComment = ko.observable('');
	var issues = ko.observableArray();
	var forceVisibleProjectsDummy = ko.observable();
	var deferredAddingProjectLog = $.Deferred();
	
	var projectActivities = ko.computed(function (){
		var mappedActivities = [];
		
		jQuery.each(activities, function(id, value) {
			var activityVM = activityViewModel(value);
			mappedActivities.push(activityVM);
			
		});
		
		return mappedActivities;

	});
	
	var visibleProjects = ko.computed( function(){
		forceVisibleProjectsDummy();
		
		chart = $('#container').highcharts(); // had to add again otherwise chart was  undefined ...
		if(!chart){
			return [];
		}
		
		var visible_projects = ko.utils.arrayFilter(chart.legend.allItems, function (project){
			return project.visible;
		});
		
		return visible_projects.map(function(item){
			return item.name;
		});
		
	});
		
	var filteredIssues = ko.computed( function (){
		var search = query().toLowerCase();

		return ko.utils.arrayFilter(issues(), function(issue) {
			if((issue.subject.toLowerCase().indexOf(search) >= 0 || issue.id.toString().indexOf(search) >= 0) && (visibleProjects().length==0 || (visibleProjects().length!=0 && visibleProjects().indexOf(issue.project.name) >=0))){
				projectId(issue.project.id);
				return true;
			}
			else {return false;}
        });
	});
		
	var logs = ko.observableArray();
	
	
	var addProjectLog = function (project_id,hours,activity) {
			var activity = activity;
			console.log('create log ' + hours + ' hours for project ' + project_id + ' with activity ' + activity.id);
			
			$.ajax( {
				type : "POST",
				data : {
					time_entry : {
						project_id : project_id,
						hours : hours,
						activity_id : activity.id,
						comments : projectComment() != undefined ? projectComment() : '',
						spent_on : model.date()
					}
				},
				url : redmineBaseUri + "time_entries.json?key=" + apiKey,
				cache : false
				})
				.done(function(data) {
					activity.logs.push(data.time_entry);
					
					var chart = $('#container').highcharts();
					chart.get(data.time_entry.project.id).addPoint([ Date.parse(moment(data.time_entry.spent_on,'YYYY-MM-DD').add(1, 'days')), data.time_entry.hours],true);
					console.log("successfully added log entry");
					
				}).fail(function() {
					console.log("error while adding log entry");
			  });
	};
	
	var addLog = function (issue,hours,activity) {
			var activity = activity;
			console.log('create log ' + hours + ' hours for issue ' + issue.id + ' with activity ' + activity.id);
			
			// temporary update the 
			
			selectedIssue(issue);
			
			// we display the cancel button
			var deferredLog = $.Deferred();
			issue.deferredAddingLog(deferredLog);
			
			deferredLog.done(function(issue,hours,activity) {
				$.ajax( {
				type : "POST",
				data : {
					time_entry : {
						issue_id : issue.id,
						hours : hours,
						activity_id : activity.id,
						comments : issue.comment() != undefined ? issue.comment() : '',
						spent_on : model.date()
					}
				},
				url : redmineBaseUri + "time_entries.json?key=" + apiKey,
				cache : false
				})
				.done(function(data) {
					activity.logs.push(data.time_entry);
					selectedIssue().deferredAddingLog(null);
					console.log("successfully added log entry");
					
				}).fail(function() {
					selectedIssue().deferredAddingLog(null);
					chart.get(issue.project.id).removePoint(chart.get(issue.project.id).points.length-1);
					
					console.log("error while adding log entry");
			  });
			});
					
			var chart = $('#container').highcharts();
			var newPoint = chart.get(issue.project.id).addPoint([ Date.parse(moment(model.date(),'YYYY-MM-DD').add(1, 'days')), hours],true);
			
			setTimeout(function() { 
				deferredLog.resolve(issue,hours,activity);
			},3000);
			
	};
	
	var cancelLog = function (defereredLog)	{
		console.log("cancel adding time for issue " + selectedIssue().id);
		
		var serie = chart.get(selectedIssue().project.id);
		serie.removePoint(serie.points.length-1);
		defereredLog().reject();
		selectedIssue().deferredAddingLog(null);
	}
	
	function sumLogs(){
		var result = 0;
		
		if(this.logs == undefined || this.logs == null) {
			return result;
		}
		
		ko.utils.arrayForEach( this.logs(), function (log) {
			result += log.hours;
		});
		
		return result;
	};
	
	var selectIssue = function (issue){
	
		var issueTimeEntries = $.grep(model.logs(), function (e) {
			return e.issue != undefined ? e.issue.id == issue.id : false
		});
	
		// flag sum = 0 property as observable
		if(issue.activities().length == 0)
		{
			ko.utils.arrayForEach(projectsInfo[issue.project.id].activities, function (activity){
				var activityVM = activityViewModel(activity);
				
				activityVM.logs($.grep(issueTimeEntries, function (log) {
					return activity.id == log.activity.id;
				}));
				
				issue.activities.push(activityVM);		
			});
		}
		
		selectedIssue(issue);
		
		issue.isActivitiesVisible(!issue.isActivitiesVisible());
	};

	function cleanIssues(){
		issues.removeAll();
	};

	function loadIssues(query,offset){
	offset	= typeof offset !== 'undefined' ? offset : 0;

		$.ajax( {
		url : query + "&offset=" + offset + "&limit=" + apiRestLimit,
		cache : false
		})
	  .done(function(data) {
	  
	  model.appendIssues(data.issues);
	  
	  // we have more results than the rest limitation, we have to handle paging queries 
	  if((data.offset + data.limit) < data.total_count){
	  		console.log("total issues " + data.total_count + " paging");
			  loadIssues(query,offset + apiRestLimit);
		}
	  
	  })
	  .fail(function(XMLHttpRequest, textStatus, error) {
	    console.log("error while retrieving " + query);
	  });
	}

	var selectedIssue = ko.observable();
	
	function appendIssues(issues){
		issues.forEach(function (issue) {
			
			var found = $.grep(model.issues(), function(e){ 
				return e.id == issue.id;
				});
		
			if(found.length == 0) {
				issue.isActivitiesVisible = ko.observable(false);
				issue.deferredAddingLog = ko.observable();
				issue.comment = ko.observable();
				issue.status = issue.status.name.toLowerCase();
				issue.color = getProjectColor(issue.project.id);
				issue.assignee = ko.computed( function () {
					return issue.assigned_to == undefined ? "n/a" : issue.assigned_to.name.substr(issue.assigned_to.name.lastIndexOf(" ")+1).toLowerCase();
				});
				
				issue.activities = ko.observableArray();
				model.issues.push(issue);
		}
	});
	
	console.log(issues.length + " issues added");
	model.issues.sort(function(left, right) { return left.updated_on == right.updated_on ? 0 : (left.updated_on < right.updated_on ? 1 : -1) });
	}
	
	function loadTimeLogs(query, offset)
	{	
		offset	= typeof offset !== 'undefined' ? offset : 0;
		
		// load time log
		$.ajax( {
			url : query + "&offset=" + offset + "&limit=" + apiRestLimit,
			cache : false
		})
		.done(function(data) {
					
			chart = $('#container').highcharts();
			model.logs(data.time_entries);
			data.time_entries.forEach(function(tlog){
			
				if(chart.get(tlog.project.id) == null){
					chart.addSeries({ id : tlog.project.id, name : tlog.project.name , color : getProjectColor(tlog.project.id)},false);
				}
				
				chart.get(tlog.project.id).addPoint([ Date.parse(moment(tlog.spent_on,'YYYY-MM-DD').add(1, 'days')), tlog.hours],false);
			});
			
			if((data.offset + data.limit) < data.total_count){
				loadTimeLogs(query,offset + apiRestLimit);
			}
			
			chart.redraw();
					
		}).fail(function() {
	    console.log("error while retrieving time logs");
	  });
	}
	
	return {
		date : date,
		query : query,
		appendIssues : appendIssues,
		loadIssues : loadIssues,
		loadTimeLogs : loadTimeLogs,
		cleanIssues : cleanIssues,
		issues : issues,
		filteredIssues : filteredIssues,
		selectIssue : selectIssue,
		selectedIssue : selectedIssue,
		visibleProjects : visibleProjects,
		logs : logs,
		addLog : addLog,
		addProjectLog : addProjectLog,
		chart: chart,
		forceVisibleProjectsDummy : forceVisibleProjectsDummy,
		projectId : projectId,
		projectActivities : projectActivities,
		projectComment : projectComment,
		cancelLog : cancelLog,
		deferredAddingProjectLog: deferredAddingProjectLog
	};
};
