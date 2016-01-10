			$('#container').highcharts({
	        chart: {
	            type: 'column',
				backgroundColor:'rgba(255, 255, 255, 0.1)'
	        },
	        title: {
	            text : ''
	        },
			events: {
            	load: function () {
                	//add report div
                   	var ch = this,
                        x = 20,
                        y = 57;
                    
                    ch.flashText = ch.renderer.text('<div id="flash"><div id="report"></div></div>', x , y +10, true).attr({
                        zIndex: 101
                    }).add();
            	}
			},
			legend : {
				itemEvents: {
                	dblclick: function (event) {
						var found = false;
						
						jQuery.each(projectsInfo, function(id, value) {
							if(value.name == event.target.innerHTML)
							{
								window.open(redmineBaseUri + 'projects/' + id + '/issues/new','_blank');
								found = true;
							}
						});

						// let's do something if not found
						if(!found)
							alert('Project named ' + event.target.innerHTML + ' not configured in settings.js');
							
						return false;
                	}
				}
			},
			credits : {
				enabled : false
			},
			plotOptions: {
	            series: {
	                stacking: 'normal',
					pointWidth: 20,
					animation: false,
					events: {
						legendItemClick: function(event){
							
							var seriesIndex = this.index;
		                    var series = this.chart.series;

		                    for (var i = 0; i < series.length; i++) {
		                        // rather than calling 'show()' and 'hide()' on the series', we use setVisible and then
		                        // call chart.redraw --- this is significantly faster since it involves fewer chart redraws
		                        if (series[i].index === seriesIndex) {
		                            if (!series[i].visible) series[i].setVisible(true, false);
		                        } else {
		                            if (series[i].visible) series[i].setVisible(false, false);
		                        }
		                    }
		                    this.chart.redraw();
							
							model.forceVisibleProjectsDummy.notifySubscribers();
							
							return false;
						}
					}
	            }
	        },
			xAxis: {
				type: 'datetime',
	            tickPositioner: function() {
	                var ticks = [];
	                $.each(this.series, function (index ,value) {
	                   ticks = ticks.concat(value.xData);
	                });              
	                return   ticks;
	            },
	            labels: {
					rotation : 25,
	                formatter: function() {
	                    return Highcharts.dateFormat('%a %d', this.value);
	               }
	            }
			},
			yAxis: {
				labels: {
					enabled : false
					},
				title: {
	                text: null
	            },
				stackLabels: {
	                enabled: true,
	                style: {
	                    fontWeight: 'bold',
	                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
	                }
	            }
			}
			});