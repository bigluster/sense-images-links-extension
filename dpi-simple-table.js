define(["jquery", "text!./dpi-simple-table.css"], function($, cssContent) {'use strict';
	$("<style>").html(cssContent).appendTo("head");
	return {
		initialProperties : {
			version : 1.0,
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qInitialDataFetch : [{
					qWidth : 10,
					qHeight : 50
				}]
			}
		},
		definition : {
			type : "items",
			component : "accordion",
			items : {
				dimensions : {
					uses : "dimensions",
					min : 1
				},
				measures : {
					uses : "measures",
					min : 0
				},
				sorting : {
					uses : "sorting"
				},
				settings : {
					uses : "settings",
					items : {
						initFetchRows : {
							ref : "qHyperCubeDef.qInitialDataFetch.0.qHeight",
							label : "Initial fetch rows",
							type : "number",
							defaultValue : 50
						},
						links:{
						  type: "boolean",
						  component: "switch",
						  translation: "Enable Links",
						  ref: "linkColumns",
						  defaultValue: true,
						  trueOption: {
							  value: true,
							  translation: "properties.on"
							  },
						  falseOption: {
							  value: false,
							  translation: "properties.off"
							  },
						  show: true
						},
						images : {
							type : "items",
							label : "Embedded Images",
							items : {	
								linkingColumns : {				
								  type: "boolean",
								  component: "switch",
								  translation: "Enable Embedded Images",
								  ref: "imageColumns",
								  defaultValue: true,
								  trueOption: {
									  value: true,
									  translation: "properties.on"
									  },
								  falseOption: {
									  value: false,
									  translation: "properties.off"
									  },
								  show: true
								},
								imageHeight : {
									ref : "imageHeight",
									label : "Image Height",
									type : "string",
									defaultValue : 100
								},
							}
						}
					}
				}
			}
		},
		snapshot : {
			canTakeSnapshot : true
		},
		paint : function($element, layout) {
			var html = "<table><thead><tr>", self = this, lastrow = 0, morebutton = false, dimcount = this.backendApi.getDimensionInfos().length;
			//render titles
			$.each(this.backendApi.getDimensionInfos(), function(key, value) {
				html += '<th align="left">' + value.qFallbackTitle + '</th>';
			});
			$.each(this.backendApi.getMeasureInfos(), function(key, value) {
				html += '<th align="left">' + value.qFallbackTitle + '</th>';
			});
			html += "</tr></thead><tbody>";
			//render data
			this.backendApi.eachDataRow(function(rownum, row) {
				lastrow = rownum;
				html += '<tr>';
				$.each(row, function(key, cell) {
					if(cell.qIsOtherCell) {
						cell.qText = self.backendApi.getDimensionInfos()[key].othersLabel;
					}
					html += "<td class='";
					if(!isNaN(cell.qNum)) {
						html += "numeric ";
					}
					//negative elementnumbers are not selectable
					if(key < dimcount && cell.qElemNumber > -1) {
						html += "selectable' data-value='" + cell.qElemNumber + "' data-dimension='" + key + "'";
					} else {
						html += "'";
					}
				  //check for potential links, and if so, convert
				if(layout.linkColumns){
					if(cell.qText.slice(0,4)==='http'){
						html += '> <a href="' + cell.qText + '" target="_blank">' + cell.qText + '</a></td>';
					}
					else if(cell.qText.slice(0,3)==='www'){
						html += '> <a href="http://' + cell.qText + '" target="_blank">' + cell.qText + '</a></td>';
					}
					else{
						html += '>' + cell.qText + '</td>';
					}
				}
				  //check for potential images, and if so, convert
				else if(layout.imageColumns){
					if(~cell.qText.indexOf('img.') || ~cell.qText.indexOf('.jpg') || ~cell.qText.indexOf('.tiff') || ~cell.qText.indexOf('.gif') || ~cell.qText.indexOf('.png')){
						html += '> <img src="' + cell.qText + '" height=' + layout.imageHeight + '></td>';
					}
					else{
						html += '>' + cell.qText + '</td>';
					}
				}
				  //otherwise, no formatting
				else{
					html += '>' + cell.qText + '</td>';
				}

				});
				html += '</tr>';			    
			});
			html += "</tbody></table>";
			//add 'more...' button
			if(this.backendApi.getRowCount() > lastrow + 1) {
				html += "<button id='more'>More...</button>";
				morebutton = true;
			}
			$element.html(html);
			if(morebutton) {
				var requestPage = [{
					qTop : lastrow + 1,
					qLeft : 0,
					qWidth : 10, //should be # of columns
					qHeight : Math.min(50, this.backendApi.getRowCount() - lastrow)
				}];
				$element.find("#more").on("qv-activate", function() {
					self.backendApi.getData(requestPage).then(function(dataPages) {
						self.paint($element);
					});
				});
			}
			$element.find('.selectable').on('qv-activate', function() {
				if(this.hasAttribute("data-value")) {
					var value = parseInt(this.getAttribute("data-value"), 10), dim = parseInt(this.getAttribute("data-dimension"), 10);
					self.selectValues(dim, [value], true);
					$element.find("[data-dimension='"+ dim +"'][data-value='"+ value+"']").toggleClass("selected");
				}
			});
		}
	};
});
