
function PBHelper (options) {

    this.options = options;
    this.sets_base_url = "getproduct.php?productnumber=";
	this.bricks_base_url = "getitemordesign.php?getitemordesign=";
	this.defaultImage = "assets/img/defaultimg.gif";
	this.country = "";

	//SETUP 1° : We validate some options params
	if (this.options.LLDUpload_interface == "") {
		console.log("PBHELPER ERROR", "Non optinal option missing", "LLDUpload_interface");
		return;
	}
	if (this.options.SetSearch_interface == "") {
		console.log("PBHELPER ERROR", "Non optinal option missing", "SetSearch_interface");
		return;
	}
	if (this.options.BrickSearch_interface == "") {
		console.log("PBHELPER ERROR", "Non optinal option missing", "BrickSearch_interface");
		return;
	}

	/*
	 * PBHelper and Main functions
	 */

	//This function return the common name of a color (string) from a LEGO defined colorCode
	this.getColorName = function(colorCode) {
		if (LEGO_Color[colorCode] != null) {
			return LEGO_Color[colorCode].Name;
		} else {
			return "";
		}
	}

	//This function return the LEGO ID of a color (string) from a LEGO defined colorCode
	this.getColorLegoID = function(colorCode) {
		if (LEGO_Color[colorCode] != null) {
			return LEGO_Color[colorCode].LegoID;
		} else {
			return "";
		}
	}

	//This function found a color in a list of bricks returned from the site base on a color code
	this.associateColor = function (colorCode, bricks) {

		var reponse = -1;
		var colorID = this.getColorLegoID(colorCode);

		$.each(bricks, function( i, brick ){
			if (brick.ColourDescr.toLowerCase() === colorID.toLowerCase()) {
				reponse = i;
				return false;
			}
		});

		return reponse;
	}

	//This function round the number to a 2 decimal format for price display
	this.roundPrice = function(price) {
		return (Math.round(price * 100) / 100).toFixed(2);
	}

	//This function add a part row to a table. One function to rule them all
	this.AddPartsTableRow = function(destination, template, brickData, preview) {

		//Some data is required
		if (destination == null) {
			console.log("PBHELPER ERROR", "Non optinal option missing in tableAddPart function", "table");
			return;
		}
		if (template == null) {
			console.log("PBHELPER ERROR", "Non optinal option missing in tableAddPart function", "template");
			return;
		}
		if (brickData.DesignId == null) {
			console.log("PBHELPER ERROR", "Non optinal option missing in tableAddPart function", "DesignId");
			return;
		}


		//We parse the brickData to fill in blanks
		brickData.nbReq = brickData.nbReq || "";						//NB Required in the set
		brickData.ItemNo = brickData.ItemNo || "";						//Element ID
		brickData.baseUrl = brickData.baseUrl || "";					//The Part image base url
		brickData.Asset = brickData.Asset || "";						//The Part image
		brickData.ItemDescr = brickData.ItemDescr || "";				//The Part description
		brickData.Price = brickData.Price || "";						//The Part price
		brickData.CId = brickData.CId || "";							//The Part price currency
		preview = preview || false;										//[Optional] it's a preview, so we don't mind errors

		//Before adding a new line, we try to find the color name
		if (brickData.colorCode != null) {
			var color_name = this.getColorName(brickData.colorCode);
		} else {
			var color_name = brickData.ColourDescr;
		}

		//We also format the CId
		if (brickData.CId != "") {
			brickData.CId = " $" + brickData.CId;
		}

		//Format the image path
		if (brickData.Asset != "" && brickData.baseUrl != "") {
			var PartImage = brickData.baseUrl + brickData.Asset;
		} else {
			var PartImage = this.defaultImage;
		}

		//On s'occupe des infos générales
		$(template).find(".templateTable_row").find(".desingID").html(brickData.DesignId);
		$(template).find(".templateTable_row").find(".elementID").html(brickData.ItemNo);
		$(template).find(".templateTable_row").find(".qte").html(brickData.nbReq);
		$(template).find(".templateTable_row").find(".asset").find("img").attr('src', PartImage);
		$(template).find(".templateTable_row").find(".desc").html(brickData.ItemDescr);
		$(template).find(".templateTable_row").find(".color").html(color_name);

		//We try to format the error
		//1° LEGO_PartNotAvailable :: Part element found (color found), but not in stock. Price will be "-1"
		if (brickData.Price == -1 && !preview) {
			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartNotAvailable").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);
			$(template).find(".templateTable_row").find(".priceTotal").html("-");

		//2° LEGO_PartColorNotFound :: Part desing ID was found, but no color match. ElementID will be empty
		} else if (brickData.ItemNo == "" && brickData.ItemDescr != "" && !preview) {
			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartColorNotFound").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);
			$(template).find(".templateTable_row").find(".priceTotal").html("-");

			//We will aso modify the image class
			$(template).find(".templateTable_row").find(".asset").find("img").addClass("bw-image");


		//3° LEGO_PartNotFound :: Part description was not found.
		} else if (brickData.ItemDescr == "" && !preview) {
			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartNotFound").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);
			$(template).find(".templateTable_row").find(".priceTotal").html("-");

		//4° No error were found...
		} else {
			$(template).find(".templateTable_row").find(".price").html(brickData.Price + brickData.CId);
			$(template).find(".templateTable_row").find(".priceTotal").html(this.roundPrice(brickData.Price*brickData.nbReq) + brickData.CId);
		}

		//Copy the line
		$(template).find(".templateTable_row").clone().removeAttr('id').appendTo(destination);

		//Because the temp,late will retain the class if we don't remove it
		$(template).find(".templateTable_row").find(".asset").find("img").removeClass("bw-image");
	}

	//This function is used from the HTML select element
	this.updateCountry = function(element) {

		//Get the selected country code
		var country = $(element).find(":selected").val();

		//Set the country
		this.setCountry(country);
	}

	//This function sets the country and update all the select
	this.setCountry = function(country) {

		//Set the var
		this.country = country;

		//Update all the select on the page
		$('.coutrySelect').removeAttr('selected');
		$('.coutrySelect option[value='+country+']').attr('selected','selected');
	}

	//This function send the analitics data to Google Analitycs
	this.SendAnalytics = function (url, pageTitle) {

		if (typeof ga != 'undefined') {
			ga('send', {
				'hitType': 'pageview',
				'page': url,
				'title': pageTitle
			});
		}
	}

	/*
	 * Setup actions
	 */

	//Initialise les prototypes
	this.LDDUpload();
	this.SetSearch();
	this.BrickSearch();
	this.Navigation();

	//Setup default country
	this.setCountry("CA");
}


/*
 * LDDUpload
 */
PBHelper.prototype.LDDUpload = function() {

	//Lien vers PBHelper
	this.LDDUpload.parent = this;

	/*
	 * LDDUpload variables
	 */

	this.LDDUpload.Parts = new Object;
	this.LDDUpload.numberBricks = 0;
	this.LDDUpload.numberElements = 0;
	this.LDDUpload.PartsValue = 0;

	this.LDDUpload.SetList = new Array;

	/*
	 * LDDUpload UI svariables
	 */

	this.LDDUpload.UI = {
		"Main"				: this.options.LLDUpload_interface,
		"LDDPannel" 		: "#LDDUpload_file",
		"PartsTableSource"	: "#LDDtemplateTable",
		"Progress"			: "#analyseLDD_progress"
	};

	/*
	 * LDDUpload main Functions
	 */

	//This function reset the variables
	this.LDDUpload.resetVars = function() {
		this.Parts = new Object;
		this.numberBricks = 0;
		this.numberElements = 0;
		this.PartsValue = 0;

		this.SetList = new Array;
	}

	//This function process the data received from the file and call the UI for display
	this.LDDUpload.processLDDData = function(data, fileName) {

		//1° Set our variable
		this.Parts = data.bricks;
		this.numberBricks = data.nb_bricks;
		this.numberElements = data.nb_elements;

		//2° Set the UI
		this.UI_setLDDPannel(fileName, data.nb_bricks, data.nb_elements, data.image);

	}

	//This function is called to preview the parts found in the LDD file
	this.LDDUpload.Preview = function() {

		//Reset the table
		this.UI_resetPartsTable();

		//We are going into .each. We need to make "this" safe
		var _this = this;

		//We add each brick to the table
		$.each(this.Parts, function( DesignId, color_data ){
			$.each(color_data, function( colorCode, NbRequired ){

				_this.parent.AddPartsTableRow(
					$(_this.UI.Main).find(_this.UI.LDDPannel + " > table"),	// Destination
					$(_this.UI.Main).find(_this.UI.PartsTableSource), 		// Source
					{														// BricksData
						"DesignId" : DesignId,
						"colorCode" : colorCode,
						"nbReq" : NbRequired
					},
					true													// Preview
				);
			});
		});

		//Show the table
		this.UI_showPartsTable();

	}

	//This function analyse the parts list and found each part info from LEGO service
	this.LDDUpload.Analyse = function() {

		//Reset the table
		this.UI_resetPartsTable();

		//Disabled the buttons
		this.UI_disableButtons();

		//Show the progress
		this.UI_Progress_init();

		//Variable to keep progress of the current number of part processed
		var currentPart = 0;

		//We are going into .each. We need to make "this" safe
		var _this = this;

		//We add each brick to the table
		$.each(this.Parts, function( DesignId, color_data ){

			//Start with analaytics
			_this.parent.SendAnalytics(_this.parent.bricks_base_url + DesignId + "&country=" + _this.parent.country, "Get item or design");

			$.ajax({

				method: "GET",
				url: _this.parent.bricks_base_url + DesignId + "&country=" + _this.parent.country,

			}).done(function(data) {

				//Process each brick in result
				$.each(color_data, function( colorCode, NbRequired ){

					//1° We try to find a color match
					if (data != null) {
						var found_brick = _this.parent.associateColor(colorCode, data.Bricks);
					}

					//2° Sum the list value
					if (data != null && found_brick != -1 && data.Bricks[found_brick].Price != -1) {
						_this.PartsValue = _this.PartsValue + data.Bricks[found_brick].Price * NbRequired;
					}

					//3° We prepare the brick Data line
					var BrickData = {
						"DesignId" : DesignId,
						"colorCode" : colorCode,
						"nbReq" : NbRequired
					}

					//4° If we have data, we merge it
					if (data != null && found_brick != -1) {

						//We send our default data with the found brick and the base url
						BrickData = $.extend(BrickData, data.Bricks[found_brick], {"baseUrl" : data.ImageBaseUrl});

					} else if (data != null) {

						//We send our default data with the base url and add some part details since we don't have a brick, but we still have *some* info
						BrickData = $.extend(BrickData, {"baseUrl" : data.ImageBaseUrl, "ItemDescr" : data.Bricks[0].ItemDescr, "Asset" : data.Bricks[0].Asset});
					}

					//5° Add line to the mighty table
					_this.parent.AddPartsTableRow(
						$(_this.UI.Main).find(_this.UI.LDDPannel + " > table"),	// Destination
						$(_this.UI.Main).find(_this.UI.PartsTableSource), 		// Source
						BrickData
					);

					//! TEST
					_this.SetList.push(BrickData);

					//We update the progress
				    currentPart++;
				    _this.UI_Progress_update(currentPart);

					//Check if we are done
				    if (currentPart >= _this.numberElements) {
						_this.Analyse_done();
						_this.UI_Progress_done();
					}

				});

			})
			.fail(function(data) {
				console.log("PBHELPER ERROR", data);
			})
			.always(function(data) {
				//console.log("this.LDDUpload.Analyse AJAX", data);
			});
		});
	}

	this.LDDUpload.testString = function() {
		var reponse = 'var a = angular.element(document.getElementsByClassName("rp")).scope(); var b = angular.element(document.getElementsByClassName("rp-bag-list")).scope();';
		$.each(this.SetList, function(i,brick) {
			if (brick.SQty >= brick.nbReq) {
				for (i = 0; i < brick.nbReq; i++) {
					reponse = reponse + 'a.addToBasket(' + JSON.stringify(brick) + ', b);';
				}
			}
		});
		reponse = reponse + 'angular.element(document.getElementsByClassName("rp")).scope().$apply();';
		console.log(reponse);
	}

	//This function is called when all parts are analysed. Show the table and set the UI
	this.LDDUpload.Analyse_done = function() {

		//We process and add the total row
		this.Analyse_addTotalRow();

		//We show the table
		this.UI_showPartsTable();

		//To set the buttons, we reable them and disabled again with the switch
		this.UI_resetButtons();
		//this.UI_disableButtons(true);
	}

	//This function add the total row to the table
	this.LDDUpload.Analyse_addTotalRow = function() {

		//We set the value in the template
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").find(".txtTotal").html(this.parent.roundPrice(this.PartsValue)+" $");

		//We copy it to the pannel
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").clone().appendTo($(this.UI.Main).find(this.UI.LDDPannel + " > table"));
	}

	/*
	 * UI Functions
	 */

	//This function setup the file info pannel and show it.
	this.LDDUpload.UI_setLDDPannel = function(fileName, nb_bricks, nb_elements, fileImage) {
		$(this.UI.Main).find(this.UI.LDDPannel).find(".panel-heading").html(fileName);
		$(this.UI.Main).find(this.UI.LDDPannel).find(".setNbPieces").html(nb_bricks);
		$(this.UI.Main).find(this.UI.LDDPannel).find(".setNbUniqueElements").html(nb_elements);
		$(this.UI.Main).find(this.UI.LDDPannel).find("img").attr('src', fileImage);
		$(this.UI.Main).find(this.UI.LDDPannel).show();
	}

	//This function reset the file info pannel and hide it.
	this.LDDUpload.UI_resetLDDPannel = function() {
		$(this.UI.Main).find(this.UI.LDDPannel).find(".panel-heading").html("");
		$(this.UI.Main).find(this.UI.LDDPannel).find(".setNbPieces").html(0);
		$(this.UI.Main).find(this.UI.LDDPannel).find(".setNbUniqueElements").html(0);
		$(this.UI.Main).find(this.UI.LDDPannel).find("img").attr('src', this.parent.defaultImage);
		$(this.UI.Main).find(this.UI.LDDPannel).hide();

		//Also reset the buttons
		this.UI_resetButtons();

		//Reset the table
		this.UI_resetPartsTable();
	}

	//This function reset the parts table
	this.LDDUpload.UI_showPartsTable = function() {

		//Show the table
		$(this.UI.Main).find(this.UI.LDDPannel + " > table").show();

		//We must also reset the Bootstrap Tooltips added with Javascript
		$('[data-toggle="tooltip"]').tooltip();
	}

	//This function reset the parts table
	this.LDDUpload.UI_resetPartsTable = function() {
		$(this.UI.Main).find(this.UI.LDDPannel + " > table").find("tr:gt(0)").remove(); //Remove all lines
		$(this.UI.Main).find(this.UI.LDDPannel + " > table").hide(); //Hide the table
	}

	//This function disabled all button. Option can omit the destroy one
	this.LDDUpload.UI_disableButtons = function(omitDestroy) {

		omitDestroy = omitDestroy || false;

		if (omitDestroy) {
			$(this.UI.Main).find(this.UI.LDDPannel).find(".btn-analyseLDD, .btn-previewLDD").attr('disabled', 'disabled');
		} else {
			$(this.UI.Main).find(this.UI.LDDPannel).find(".btn-analyseLDD, .btn-previewLDD, .btn-deleteLDD").attr('disabled', 'disabled');
		}
	}

	//This function reset the buttons state
	this.LDDUpload.UI_resetButtons = function() {
		$(this.UI.Main).find(this.UI.LDDPannel).find(".btn-analyseLDD, .btn-previewLDD, .btn-deleteLDD").removeAttr('disabled');
	}

	//This function set the analyser progress bar
	this.LDDUpload.UI_Progress_init = function() {
		$(this.UI.Main).find(this.UI.Progress).show();
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html("0");
		$(this.UI.Main).find(this.UI.Progress).find("span.totalnb").html(this.numberElements);
		$(this.UI.Main).find(this.UI.Progress).find("div.progress-bar").css("width", "0%");
	}

	//This function update the analyser progress bar.
	this.LDDUpload.UI_Progress_update = function(current) {
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(current);
		$(this.UI.Main).find(this.UI.Progress).find("div.progress-bar").css("width", (current/this.numberElements*100)+"%");
	}

	//This function hide the analyser progress bar.
	this.LDDUpload.UI_Progress_done = function() {
		$(this.UI.Main).find(this.UI.Progress).hide();
	}
}

/*
 * SetSearch
 */
PBHelper.prototype.SetSearch = function() {

	//Keep a link to PBHelper
	this.SetSearch.parent = this;

	/*
	 * SetSearch variables
	 */

	 var totalSearch = 0; //Number of sets to search for

	/*
	 * SetSearch UI variables
	 */

	this.SetSearch.UI = {
		"Main"			: this.options.SetSearch_interface,
		"Form"			: "#setForm",
		"FormInput"		: "#setFormValue",
		"SetPlaceholder"	: "#setsPlaceholder",
		"SetPannel" 		: "#setsPannelTemplate",
		"PartsTableSource"	: "#setTemplateTable",
		"Progress"			: "#setProgress",
		"Error"				: "#setNotFound"
	};

	/*
	 * LDDUpload main Functions
	 */

	this.SetSearch.Search = function() {

		//Reset the UI
		this.UI_reset();

		//Disable the search buttons
		this.UI_disableButtons();

		//Get the form data
		var itemordesignnumber = $(this.UI.Main).find(this.UI.Form).find(this.UI.FormInput).val();
		var items = itemordesignnumber.split(",");

		//Set the infos for the progress
		var currentPart = 0;
		this.totalSearch = items.length;
		this.UI_Progress_init();

		//We are going into .each. We need to make "this" safe
		var _this = this;

		//For each item in the form list
		$.each(items, function( index, item ){

			//We trim to get rid of spaces used in the comma separated list
			item = item.trim();

			//Start with analaytics
			_this.parent.SendAnalytics(_this.parent.sets_base_url + item + "&country=" + _this.parent.country, "Get set");

			$.ajax({

				method: "GET",
				url: _this.parent.sets_base_url + item + "&country=" + _this.parent.country,

			}).done(function(data) {

				if (data === null) {

					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html(item);

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.SetPlaceholder));

				} else {

					//We create a the pannel
					var createdPannelID = _this.UI_createPannel(
						data.Product.ProductName,
						data.ImageBaseUrl + data.Product.Asset,
						data.Product.ProductNo,
						data.Bricks.length
					);

					//Process each brick in result
					$.each(data.Bricks, function( index, brick ){

						//1° Add some info to the data object
						BrickData = $.extend(brick, {"baseUrl" : data.ImageBaseUrl});

						//2° Add the table row
						_this.parent.AddPartsTableRow(
							$(_this.UI.Main).find(createdPannelID + " > table"),	// Destination
							$(_this.UI.Main).find(_this.UI.PartsTableSource), 		// Source
							BrickData
						);

					});
				}

				//We update the progress
			    currentPart++;
			    _this.UI_Progress_update(currentPart);

				//Check if we are done
			    if (currentPart >= _this.totalSearch) {
					_this.done();
					_this.UI_Progress_done();
				}

			})
			.fail(function(data) {
				console.log("PBHELPER ERROR", data);
			})
			.always(function(data) {
				//console.log(data);
			});


		});

	}

	//This function reset the UI and take cares of function once everything is done
	this.SetSearch.done = function() {

		//We can show the holder
		$(this.UI.Main).find(this.UI.SetPlaceholder).show();

		//Reset the button
		this.UI_resetButtons();

		//We must also reset the Bootstrap Tooltips added with Javascript
		$('[data-toggle="tooltip"]').tooltip();
	}

	/*
	 * UI Functions
	 */

	//This function reset the UI (flush the result div)
	this.SetSearch.UI_reset = function() {
		//We empty the result holder
		$(this.UI.Main).find(this.UI.SetPlaceholder).html("");

		//...and we hide it
		$(this.UI.Main).find(this.UI.SetPlaceholder).hide();
	}

	//This function create a div containing the set infos and part table
	this.SetSearch.UI_createPannel = function(setName, setImage, setNumber, setNbPieces) {

		//Set the pannel details
		$(this.UI.Main).find(this.UI.SetPannel).find(".panel-heading").html(setName);
		$(this.UI.Main).find(this.UI.SetPannel).find(".setImg").attr('src', setImage);
		$(this.UI.Main).find(this.UI.SetPannel).find(".setNumber").html(setNumber);
		$(this.UI.Main).find(this.UI.SetPannel).find(".setNbPieces").html(setNbPieces);

		//We copy the pannel
		$(this.UI.Main).find(this.UI.SetPannel).clone().attr('id', 'SetPannel_' + setNumber).appendTo($(this.UI.Main).find(this.UI.SetPlaceholder));

		//Reset the template
		this.UI_resetTemplatePannel();

		//We return the newly created if location
		return '#SetPannel_' + setNumber;
	}

	//This function reset the template pannel
	this.SetSearch.UI_resetTemplatePannel = function() {

		$(this.UI.Main).find(this.UI.SetPannel).find(".panel-heading").html("");
		$(this.UI.Main).find(this.UI.SetPannel).find(".setNbPieces").html(0);
		$(this.UI.Main).find(this.UI.SetPannel).find(".setNbUniqueElements").html(0);
		$(this.UI.Main).find(this.UI.SetPannel).find("img").attr('src', this.parent.defaultImage);
	}

	//This function disabled all button.
	this.SetSearch.UI_disableButtons = function() {
		$(this.UI.Main).find(this.UI.Form).find(".btn").attr('disabled', 'disabled');
	}

	//This function re-enable the buttons state
	this.SetSearch.UI_resetButtons = function() {
		$(this.UI.Main).find(this.UI.Form).find(".btn").removeAttr('disabled');
	}

	//This function set the analyser progress bar
	this.SetSearch.UI_Progress_init = function() {
		$(this.UI.Main).find(this.UI.Progress).show();
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(1);
		$(this.UI.Main).find(this.UI.Progress).find("span.totalnb").html(this.totalSearch);
	}

	//This function update the analyser progress bar.
	this.SetSearch.UI_Progress_update = function(current) {
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(current+1);
	}

	//This function hide the analyser progress bar.
	this.SetSearch.UI_Progress_done = function() {
		$(this.UI.Main).find(this.UI.Progress).hide();
	}
}

/*
 * BrickSearch
 */
PBHelper.prototype.BrickSearch = function() {

	//Keep a link to PBHelper
	this.BrickSearch.parent = this;

	/*
	 * BrickSearch variables
	 */

	 var totalSearch = 0; //Number of bricks to search for

	/*
	 * BrickSearch UI variables
	 */

	this.BrickSearch.UI = {
		"Main"			: this.options.BrickSearch_interface,
		"Form"			: "#brickForm",
		"FormInput"		: "#brickFormValue",
		"Placeholder"	: "#bricksPlaceholder",
		"Pannel" 		: "#bricksPannelTemplate",
		"PartsTableSource"	: "#brickTemplateTable",
		"Progress"			: "#brickProgress",
		"Error"				: "#bricksNotFound",
	};

	/*
	 * LDDUpload main Functions
	 */

	this.BrickSearch.Search = function() {

		//Reset the UI
		this.UI_reset();

		//Disable the search buttons
		this.UI_disableButtons();

		//Get the form data
		var itemordesignnumber = $(this.UI.Main).find(this.UI.Form).find(this.UI.FormInput).val();
		var items = itemordesignnumber.split(",");

		//Set the infos for the progress
		var currentPart = 0;
		this.totalSearch = items.length;
		this.UI_Progress_init();

		//We are going into .each. We need to make "this" safe
		var _this = this;

		//For each item in the form list
		$.each(items, function( index, item ){

			//We trim to get rid of spaces used in the comma separated list
			item = item.trim();

			//Start with analaytics
			_this.parent.SendAnalytics(_this.parent.bricks_base_url + item + "&country=" + _this.parent.country, "Get item or design");

			$.ajax({

				method: "GET",
				url: _this.parent.bricks_base_url + item + "&country=" + _this.parent.country,

			}).done(function(data) {

				if (data === null) {

					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html(item);

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.Placeholder));

				} else {

					//We create a the pannel
					var createdPannelID = _this.UI_createPannel(item);

					//Process each brick in result
					$.each(data.Bricks, function( index, brick ){

						//1° Add some info to the data object
						BrickData = $.extend(brick, {"baseUrl" : data.ImageBaseUrl});

						//2° Add the table row
						_this.parent.AddPartsTableRow(
							$(_this.UI.Main).find(createdPannelID + " > table"),	// Destination
							$(_this.UI.Main).find(_this.UI.PartsTableSource), 		// Source
							BrickData
						);

					});
				}

				//We update the progress
			    currentPart++;
			    _this.UI_Progress_update(currentPart);

				//Check if we are done
			    if (currentPart >= _this.totalSearch) {
					_this.done();
					_this.UI_Progress_done();
				}

			})
			.fail(function(data) {
				console.log("PBHELPER ERROR", data);
			})
			.always(function(data) {
				//console.log(data);
			});


		});

	}

	//This function reset the UI and take cares of function once everything is done
	this.BrickSearch.done = function() {

		//We can show the holder
		$(this.UI.Main).find(this.UI.Placeholder).show();

		//Reset the button
		this.UI_resetButtons();

		//We must also reset the Bootstrap Tooltips added with Javascript
		$('[data-toggle="tooltip"]').tooltip();
	}

	/*
	 * UI Functions
	 */

	//This function reset the UI (flush the result div)
	this.BrickSearch.UI_reset = function() {
		//We empty the result holder
		$(this.UI.Main).find(this.UI.Placeholder).html("");

		//...and we hide it
		$(this.UI.Main).find(this.UI.Placeholder).hide();
	}

	//This function create a div containing the set infos and part table
	this.BrickSearch.UI_createPannel = function(SearchQuery) {

		//Set the pannel details
		$(this.UI.Main).find(this.UI.Pannel).find(".panel-heading > span").html(SearchQuery);

		//We copy the pannel
		$(this.UI.Main).find(this.UI.Pannel).clone().attr('id', 'Pannel_' + SearchQuery).appendTo($(this.UI.Main).find(this.UI.Placeholder));

		//Reset the template
		this.UI_resetTemplatePannel();

		//We return the newly created if location
		return '#Pannel_' + SearchQuery;
	}

	//This function reset the template pannel
	this.BrickSearch.UI_resetTemplatePannel = function() {

		$(this.UI.Main).find(this.UI.Pannel).find(".panel-heading > span").html("");
	}

	//This function disabled all button.
	this.BrickSearch.UI_disableButtons = function() {
		$(this.UI.Main).find(this.UI.Form).find(".btn").attr('disabled', 'disabled');
	}

	//This function re-enable the buttons state
	this.BrickSearch.UI_resetButtons = function() {
		$(this.UI.Main).find(this.UI.Form).find(".btn").removeAttr('disabled');
	}

	//This function set the analyser progress bar
	this.BrickSearch.UI_Progress_init = function() {
		$(this.UI.Main).find(this.UI.Progress).show();
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(1);
		$(this.UI.Main).find(this.UI.Progress).find("span.totalnb").html(this.totalSearch);
	}

	//This function update the analyser progress bar.
	this.BrickSearch.UI_Progress_update = function(current) {
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(current+1);
	}

	//This function hide the analyser progress bar.
	this.BrickSearch.UI_Progress_done = function() {
		$(this.UI.Main).find(this.UI.Progress).hide();
	}

	//This function force search the brick ID specified in argument
	this.BrickSearch.SearchBrick = function(brickid) {

		//Update the form
		$(this.UI.Main).find(this.UI.FormInput).val(brickid);

		//Send the search
		this.Search();

		//Show the page in navigation
		this.parent.Navigation.Go(this.UI.Main);
	}

	//This function is used to seach a brick, used in a link
	this.BrickSearch.SearchBrickLink = function(element) {

		//Get the tag id
		var brickID = $(element).text();

		//Make sure the ID is not empty
		if (brickID != "") {
			this.SearchBrick(brickID);
		}
	}
}

PBHelper.prototype.Navigation = function() {

	//Keep a link to PBHelper
	this.Navigation.parent = this;

	//This function is used for links in the menu
	this.Navigation.MenuSelect = function(element) {

		//Find the selected name
		var selected_nav = $(element).data("target");

		//Go fo it!
		this.Go("."+selected_nav);
	}

	//This general function is used to navigate the site elements
	this.Navigation.Go = function (SelectedClass) {

		//Reset all active
		$(".nav > li").removeClass("active");

		//Hide all the content
		$("div[class^=nav-app-]").hide();

		//Add the active on the selected one
		$(".nav > li"+SelectedClass).addClass("active");

		//Show the selected content
		$("div"+SelectedClass).show();

	}
}