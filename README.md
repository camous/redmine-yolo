# redmine-yolo
Ugly but practical redmine issues tracking tools. Intended to be as light as possible with no hosting constraints and being hosting on my Microsoft OneDrive.

![overview](https://raw.githubusercontent.com/camous/redmine-yolo/master/doc/screenshot1.png)

## WHY ?
I'm an heavy user of redmine on my daily job either for pure technical tasks or organization ones. However the default views & UI provided by redmine missed some features for me.

* track in a single view the ticket assigned to me & the ones I'm watching
* easily read the last updated date
* easily spot the project
* browser/search/navigate easily in these tickets
* be able to log time on either issues or projects (really cumbersome with redmine) with the minimum clicks (be able as well to change the date you log time)
* visually see what's I've done in the past
* shortcut for creating new issue for one project 

## DISCLAIMER
I'm not a developer and the source code quality & logic could be easily improved. Feel free to contribute.

## SETUP
Few configurations have to be done and then you will be free to go. Maximum 20 minutes for configuration. REST API has to be activated on your redmine instance.

Edit index.html with your redmine url, your personal api key (found in your redmine profile) and the apiRestLimit.
```javascript
	var redmineBaseUri = 'REDMINE URL';
	var apiRestLimit = 100;
	var apiKey = 'API REST KEY';
```


Then you need to configure redmine logging activities (this should be automated in the future). You need to get the exact same ID as in your redmine instance otherwise wrong activities will be used.
Moreover you can define a color associated to this activity.
You can list all your activities by using the following REST API
https://redmine.domain.com/enumerations/time_entry_activities.json?key=YOU_API_KEY

settings.js
```javascript
var activities = { 
	8 : {
		id : 8,
		name : "Design",
		color : "#952d98"
	},
	9 : {
		id : 9,
		name : "Development",
		color : "#F3D311"
	}
};
```

Unfortunately, redmine doesn't provide a REST API for getting the list of activities (defined at project level) per project, requiring to declare activities per project. You can easily find your projetc ID with another redmine REST API call.
https://redmine.domain.com/enumerations/projects.json?key=YOU_API_KEY

settings.js
```javascript
var projectsInfo = {
					1 : {
						id : 1,
						name : 'Sample Project',
						color : '#952d98',
						activities : [ 
							activities[8],
							activities[9],
							activities[10],
							activities[17]
						]
					},
					2 :	{
						id : 2,
						name : 'Sample Project 2',
						color : '#F3D311',
						activities : [ 
							activities[8],
							activities[9]
						]
					}
				};
```


