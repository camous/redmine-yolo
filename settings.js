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
				
function getProjectColor(projectId)
{
	if(projectsInfo[projectId] != undefined) {
		return projectsInfo[projectId].color;
	} else {
		console.log ('no project information for id ' + projectId);
		return 'black';
	}
}
