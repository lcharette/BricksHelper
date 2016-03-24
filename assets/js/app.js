
function PBHelper (options) {

    this.options = options;
    this.sets_base_url = "getproduct.php?productnumber=";
	this.bricks_base_url = "getitemordesign.php?getitemordesign=";
	this.users_base_url = "users.php";
	this.cache_base_url = "cache.php";
	this.defaultImage = "assets/img/defaultimg.gif";
	this.country = "";
	this.LEGOBaseURL = "https://mi-od-live-s.legocdn.com";
	this.AjaxTimeout = 15; //In seconds

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
	if (this.options.List_interface == "") {
		console.log("PBHELPER ERROR", "Non optinal option missing", "List_interface");
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

	//This function return the LEGO Service ID of a color (string) from a LEGO defined colorCode
	this.getColorLegoID = function(colorCode) {
		if (LEGO_Color[colorCode] != null) {
			return LEGO_Color[colorCode].LegoID;
		} else {
			return "";
		}
	}

	//This function finds a color in a list of bricks returned from the site base on a color code
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

	//This function finds a color in a list of bricks returned from the site base on a color description
	this.associateColourDescr = function (ColourDescr, bricks) {

		var reponse = -1;

		$.each(bricks, function( i, brick ){
			if (ColourDescr != null && brick.ColourDescr != null && brick.ColourDescr.toLowerCase() === ColourDescr.toLowerCase()) {
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

	this.AddElementToTable = function(destination, template, brick) {

		//Some data is required
		if (destination == null) {
			throw new Error("PBHELPER : Non optinal option 'table' missing in tableAddPart function");
		}
		if (template == null) {
			throw new Error("PBHELPER : Non optinal option 'template' missing in tableAddPart function");
		}

		//On s'occupe des infos générales
		$(template).find(".templateTable_row").find(".qte").html( brick.qte);
		$(template).find(".templateTable_row").find(".asset").find("img").attr('src', brick.data.getProperty('asset') );
		$(template).find(".templateTable_row").find(".desc").html( brick.data.getProperty('itemDesc') );
		$(template).find(".templateTable_row").find(".color").html( brick.data.getProperty('colorName') );
		$(template).find(".templateTable_row").find(".priceTotal").html( brick.valueStr );

		//Small thing for design ID and Element ID. We don't want to show "empty"
		if (brick.data.getProperty('ID') <= 0) {
			$(template).find(".templateTable_row").find(".elementID").html("");
		} else {
			$(template).find(".templateTable_row").find(".elementID").html( brick.data.getProperty('ID') );
		}

		if (brick.data.getProperty('designid') <= 0) {
			$(template).find(".templateTable_row").find(".desingID").html("");
		} else {
			$(template).find(".templateTable_row").find(".desingID").html( brick.data.getProperty('designid') );
		}

		//We need to do some additonnal stuff before adding the price (Total is already ok)
		//Case n°1 --> LEGO_PartNotAvailable :: Part element found (color found), but not in stock. Price will be "-1"
		if (brick.data.getProperty('price') == -1) {

			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartNotAvailable").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);

		//Case n°2 --> LEGO_PartColorNotFound :: Part desing ID was found, but no color match. ElementID will be empty
		} else if (brick.data.getProperty('price') == -2) {

			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartColorNotFound").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);

		//Case n°3 --> LEGO_PartNotFound :: Part description was not found.
		} else if (brick.data.getProperty('price') == -3) {

			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartNotFound").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);

		//Case n°4 --> Everything is found !
		} else {
			$(template).find(".templateTable_row").find(".price").html( brick.data.getProperty('priceStr') );

		}


		//Copy the line
		var t = $(template).find(".templateTable_row").clone();

		//Change the ID
		$(t).attr('id', "LegoElement-" + brick.data.getProperty('ID') );

		//Add the sort info to the line
		$(t).data('LegoElement', brick.data.getProperty('ID'));

		//Setup the add button. The "List" thingny is responsible for populating the
		//list name in the list selector
		if (brick.data.getProperty('ID') > 0) {
			this.List.setupAddButton($(t).find(".listAdd"));
		} else {
			$(t).find(".listAdd").hide();
		}

		//Keep this safe for the next part
		var _this = this;

		//We add an event to this button
		$(t).find(".listAdd .btn-add").click(function() {

			//Get the lsit ID from the list selector and we have a LegoElement object alreay. So here we go
			_this.List.addElement($(this).parents(".listAdd").data('listid'), brick);
		});

		//Add the copied line to the template
		$(t).appendTo(destination);

		//Because the temp,late will retain the class if we don't remove it
		$(template).find(".templateTable_row").find(".asset").find("img").removeClass("bw-image");
	}

	//This function add a part row to a table. One function to rule them all
	/*this.AddPartsTableRow = function(destination, template, brickData, preview) {

		//Some data is required
		if (destination == null) {
			console.log("PBHELPER ERROR", "Non optinal option missing in tableAddPart function", "table");
			return;
		}
		if (template == null) {
			console.log("PBHELPER ERROR", "Non optinal option missing in tableAddPart function", "template");
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

		//Some var for later
		var elementPrice = 0;
		var elementPriceStr = "";

		//We try to format the error
		//1° LEGO_PartNotAvailable :: Part element found (color found), but not in stock. Price will be "-1"
		if (brickData.Price == -1 && !preview) {
			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartNotAvailable").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);
			$(template).find(".templateTable_row").find(".priceTotal").html("-");

			//We also change the color code to help sorting
			elementPrice = "-1";
			elementPriceStr = "-";

		//2° LEGO_PartColorNotFound :: Part desing ID was found, but no color match. ElementID will be empty
		} else if (brickData.ItemNo == "" && brickData.ItemDescr != "" && !preview) {
			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartColorNotFound").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);
			$(template).find(".templateTable_row").find(".priceTotal").html("-");

			//We will aso modify the image class
			$(template).find(".templateTable_row").find(".asset").find("img").addClass("bw-image");

			//We also change the color code to help sorting
			elementPrice = "-2";
			elementPriceStr = "-";


		//3° LEGO_PartNotFound :: Part description was not found.
		} else if (brickData.ItemDescr == "" && !preview) {
			var tempErrorIcon = $("#LDDErrorIconTemplate").find(".LEGO_PartNotFound").clone();
			$(template).find(".templateTable_row").find(".price").html(tempErrorIcon);
			$(template).find(".templateTable_row").find(".priceTotal").html("-");

			//We also change the color code to help sorting
			elementPrice = "-3";
			elementPriceStr = "-";

		//4° If we won't have price yet, show something other than "0" to avoid confusion
		} else if (brickData.Price == 0 && brickData.CId == "") {

			$(template).find(".templateTable_row").find(".price").html("-");
			$(template).find(".templateTable_row").find(".priceTotal").html("-");

			//We also change the color code to help sorting
			elementPrice = 0;
			elementPriceStr = "";

		//5° No error were found...
		} else {
			$(template).find(".templateTable_row").find(".price").html(this.roundPrice(brickData.Price) + brickData.CId);
			$(template).find(".templateTable_row").find(".priceTotal").html(this.roundPrice(brickData.Price*brickData.nbReq) + brickData.CId);

			//We also change the color code to help sorting
			elementPrice = brickData.Price;
			elementPriceStr = this.roundPrice(brickData.Price) + brickData.CId;
		}

		//Copy the line
		var t = $(template).find(".templateTable_row").clone();

		//Change the ID
		$(t).attr('id', brickData.ItemNo + "-" + brickData.colorCode);

		//Add the sort info to the line
		$(t).data('DesignId', brickData.DesignId);
		$(t).data('elementid', brickData.ItemNo);
		$(t).data('qte', brickData.nbReq);
		$(t).data('ItemDescr', brickData.ItemDescr);
		$(t).data('color', color_name);
		$(t).data('ColourDescr', brickData.ColourDescr);
		$(t).data('Price', brickData.Price);
		$(t).data('CId', brickData.CId);
		$(t).data('Asset', brickData.Asset);
		$(t).data('total', brickData.Price * brickData.nbReq);

		//Setup the add button
		this.List.setupAddButton($(t).find(".listAdd"), brickData.ItemNo);

		//Add the copied line to the template
		$(t).appendTo(destination);

		//Because the temp,late will retain the class if we don't remove it
		$(template).find(".templateTable_row").find(".asset").find("img").removeClass("bw-image");
	}*/

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

	this.updateAddButton = function(element) {
		$(element).parents('.listAdd').data('listid', $(element).data('listid'));
		$(element).parents('.listAdd').find('.btn-select > span.txt').html($(element).text());
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

	/*this.SortTable = function(TableSource, SortBy, Order) {

		//Build a list of all the items in the table
		var rowList = new Object();
		$.each($(TableSource + " > tr"), function (i, row) {
			rowList[$(row).attr('id')] = $(row).data(SortBy);
		});

		//Sort everything
		//Source: http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
		var rowListSorted = [];
		for (var row in rowList) {
		    rowListSorted.push([row, rowList[row]]);
		}

		if (SortBy == "color") {
			rowListSorted.sort(function(a, b) {
				var aa = a[1];
				var bb = b[1];
				return aa.toLowerCase().localeCompare(bb.toLowerCase());
			});
		} else {
			rowListSorted.sort(function(a, b) {return a[1] - b[1]});
		}

		//The sort need an array. We build back an object
		var temp = new Object();
		for (var i = 0; i < rowListSorted.length; ++i) {
			var row = rowListSorted[i];
		    temp[row[0]] = row[1];
		}

		//Create a temp table
		$('body').append('<table class="hidden" id="tempTable"/>');

		//Move everything to a new temp table
		$.each(temp, function(id, value) {
			if (Order == "DESC") {
				$("#tempTable").prepend( $("#"+id) );
			} else {
				$("#tempTable").append( $("#"+id) );
			}
		});

		//move the temp table content
		$(TableSource).append( $("#tempTable > tbody > tr") );

		//Remove the temps table
		$("#tempTable").remove();
	}*/

	//This function Sort a LegoListElement
	this.SortList = function(rowList, SortBy, Order) {

		//Sort everything
		//Reference for the sort code: http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
		var rowListSorted = [];
		for (var row in rowList) {

			//Two scenario here:
			//	N°1 : Sort from list property
			//  N°2 : Sort from element property

			//Case n° 1
			if (SortBy == 'qte' || SortBy == 'value') {

				//Send the data to the array which will be sorted
				rowListSorted.push([
			    	rowList[row][SortBy],	//Sortby value
			    	row			//Data
			    ]);

			//Case n° 2
			} else {

				//Send the data to the array which will be sorted
				rowListSorted.push([
			    	rowList[row].data.getProperty(SortBy),	//Sortby value
			    	row							//Data
			    ]);
			}
		}

		//Sort the whole array
		rowListSorted.sort(function(a, b) {return a[0] - b[0]});

		//The sort need an array of two elements, but we want to return
		//an array of keys (Here [element]ID)
		var retour = new Array();
		for (var i = 0; i < rowListSorted.length; ++i) {
			var row = rowListSorted[i];
			retour.push(row[1]); //!TODO HERE
		}

		//If we asked for descending order, we do it here.
		if (Order.toLowerCase() == "desc") {
			retour.reverse();
		}

		//Done
		return retour;
	}

	this.sendLEGODataToCache = function(data) {
		$.post( this.cache_base_url, {'data': JSON.stringify(data)});
	}

	/*
	 * Setup actions
	 */

	//Initialise les prototypes
	this.LDDUpload();
	this.SetSearch();
	this.BrickSearch();
	this.List();
	this.Navigation();

	//Setup default country
	this.setCountry("CA");
}


/*
 //! ------------- LDD Upload -------------
 */
PBHelper.prototype.LDDUpload = function() {

	//Lien vers PBHelper
	this.LDDUpload.parent = this;

	/*
	 * LDDUpload variables
	 */

	this.LDDUpload.Parts = new Object;
	this.LDDUpload.numberElements = 0;
	this.LDDUpload.SortValue = "ID";
	this.LDDUpload.SortOrder = "ASC";

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
	/*this.LDDUpload.resetVars = function() {
		this.Parts = new Object;
		this.numberBricks = 0;
		this.numberElements = 0;
		this.PartsValue = 0;

		this.SetList = new Array;
	}*/

	//This function process the data received from the file and call the UI for display
	this.LDDUpload.processLDDData = function(data, fileName) {

		//Reset Data
		this.Parts = new LegoBrickList({
			"fileName": fileName,
			"asset": data.image,
		});

		//This will be used for the progress bar based on the number of elements found by PHP
		this.numberElements = Object.keys(data.bricks).length;

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
		$.each(data.bricks, function( DesignId, color_data ){

			//Start with analaytics
			_this.parent.SendAnalytics(_this.parent.bricks_base_url + DesignId + "&country=" + _this.parent.country, "Get item or design");

			$.ajax({

				method: "GET",
				timeout: _this.parent.AjaxTimeout * 1000,
				url: _this.parent.bricks_base_url + DesignId + "&country=" + _this.parent.country,

			}).always(function(data) {

				//We use always because of the timeout because we want to catch cancel and not block
				//the UI. This help checkout error.
				if (data.statusText != null) {

					//Show error to the user
					//Set the text
					//$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Error in AJAX request : Connexion timed out");

					//Copy to the placeholder
					//$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.SetPlaceholder));

					//Send error to console
					console.warn("Error in AJAX request : Connexion timed out", data);

				} else if (data.Bricks == null) {

					//Set the text
					//$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Set " + data.REQUEST + " not found");

					//Copy to the placeholder
					//$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.SetPlaceholder));

					//For debug purpose
					console.warn("Element " + data.REQUEST + " not found");

					//Process each brick in result
					$.each(color_data, function( colorCode, NbRequired ){

						//We will add it to the list to show it
						var b = new LegoElement({
							'designid' : parseInt(data.REQUEST),
							'asset': _this.parent.defaultImage,
							'price': -3, //Error code
						});

						//set the brick color
						b.setColor(colorCode);

						//Add the created brick to the list
						_this.Parts.addBrick(b, NbRequired);
					});

				} else {

					//Send to cache
					_this.parent.sendLEGODataToCache(data);

					//Process each brick in result
					$.each(color_data, function( colorCode, NbRequired ){

						//1° We try to find a color match
						var found_brick = _this.parent.associateColor(colorCode, data.Bricks);

						//Create a brick
						if (found_brick != -1) {
							var b = new LegoElement({
								'ID' : parseInt(data.Bricks[found_brick].ItemNo),
								'designid' : parseInt(data.Bricks[found_brick].DesignId),
								'asset': data.ImageBaseUrl + data.Bricks[found_brick].Asset,
								'itemDesc': data.Bricks[found_brick].ItemDescr,
								'price': data.Bricks[found_brick].Price,
								'currency': data.Bricks[found_brick].CId,
								'stock': data.Bricks[found_brick].SQty
							});

							//set the brick color
							b.setColorFromStr(data.Bricks[found_brick].ColourDescr);

							//Add the created brick to the list
							_this.Parts.addBrick(b, NbRequired);

						} else {

							console.warn("Color match not found for color code '" + colorCode + "' and designID '"+ DesignId +"'");

							var b = new LegoElement({
								'designid' : parseInt(data.Bricks[0].DesignId),
								'asset': data.ImageBaseUrl + data.Bricks[0].Asset,
								'itemDesc': data.Bricks[0].ItemDescr,
								'price': -2,
							});

							//set the brick color
							b.setColor(colorCode);

							//Add the created brick to the list
							_this.Parts.addBrick(b, NbRequired);
						}
					});
				}

				//We update the progress
			    currentPart++;
			    _this.UI_Progress_update(currentPart);

				//Check if we are done
			    if (currentPart >= _this.numberElements) {

				    //Set the UI
					_this.UI_setLDDPannel(
						_this.Parts.getProperty('fileName'),
						_this.Parts.getNbBricks(),
						_this.Parts.getNbElements(),
						_this.Parts.getProperty('asset')
					);

					//Stop the progress
				    _this.UI_Progress_done();

				    //Display the list
				    _this.displayLists();

					//To set the buttons, we reable them and disabled again with the switch
					_this.UI_resetButtons();
				}

			});
		});
	}

	//This function take care of displaying lists elements
	this.LDDUpload.displayLists = function() {

		//Vide la liste existante
		this.UI_resetPartsTable();

		//Sort the list
		//Be careful here: sorted list will ONLY return an array of elementID (keys) based on the order the list needs to be displayed.
		//We don't send the whole object sorted because apparently that CAN'T be done.
		var sortedList = this.parent.SortList(this.Parts.getBricks(), this.SortValue, this.SortOrder);

		//All every bricks
		for (var i in sortedList) {
			this.parent.AddElementToTable(
				$(this.UI.Main).find(this.UI.LDDPannel + " > table > tbody"),	// Destination
				$(this.UI.Main).find(this.UI.PartsTableSource), 				// Source
				this.Parts.getBrick(sortedList[i])											// Brick
			);
		}

		//We show the table
		this.UI_showPartsTable();
	}

	/*this.LDDUpload.testString = function() {
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
	}*/

	//This function add the total row to the table
	this.LDDUpload.Analyse_addTotalRow = function() {

		//We set the value in the template
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").find(".txtTotal").html(this.parent.roundPrice(this.PartsValue)+" $");

		//We copy it to the pannel
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").clone().appendTo($(this.UI.Main).find(this.UI.LDDPannel + " > table > tfoot"));
	}

	//This function is called by the UI to change the order of the list.
	//It only change the global param and refresh the list. The refresh function take care of the actual sorting
	this.LDDUpload.SortTable = function(SortBy, Order) {

		//Save the order
		this.SortValue = SortBy;
		this.SortOrder = Order;

		//Refresh the list
		this.displayLists();
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
		$(this.UI.Main).find(this.UI.LDDPannel).find(".btn").attr('disabled', 'disabled');
	}

	//This function reset the buttons state
	this.LDDUpload.UI_resetButtons = function() {
		$(this.UI.Main).find(this.UI.LDDPannel).find(".btn").removeAttr('disabled');
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
 //! ------------- SET SEARCH -------------
 */
PBHelper.prototype.SetSearch = function() {

	//Keep a link to PBHelper
	this.SetSearch.parent = this;

	/*
	 * SetSearch variables
	 */

	var totalSearch = 0; //Number of sets to search for

	this.fetchData = new Object;

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

		//Reset fetch data
		this.fetchData = new Object;

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
				timeout: _this.parent.AjaxTimeout * 1000,
				url: _this.parent.sets_base_url + item + "&country=" + _this.parent.country,

			}).always(function(data) {

				//We use always because of the timeout because we want to catch cancel and not block
				//the UI. This help checkout error.
				if (data.statusText != null) {

					//Show error to the user
					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Error in AJAX request : Connexion timed out");

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.SetPlaceholder));

					//Send error to console
					console.warn("Error in AJAX request : Connexion timed out", data);

				} else if (data.Bricks == null) {

					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Set " + data.REQUEST + " not found");

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.SetPlaceholder));

					//For debug purpose
					console.warn("Set " + data.REQUEST + " not found");

				} else {

					//Send to cache
					_this.parent.sendLEGODataToCache(data);

					//Create a list element
					_this.fetchData[data.REQUEST] = new LegoBrickList({
						"query" : data.REQUEST,
						"ProductName": data.Product.ProductName,
						"ProductAsset": data.ImageBaseUrl + data.Product.Asset,
						"ProductNo": data.Product.ProductNo
					});

					//Process each brick in result
					$.each(data.Bricks, function( index, brick ){

						//Create a brick
						var b = new LegoElement({
							'ID' : parseInt(brick.ItemNo),
							'designid' : parseInt(brick.DesignId),
							'asset': data.ImageBaseUrl + brick.Asset,
							'itemDesc': brick.ItemDescr,
							'price': brick.Price,
							'currency': brick.CId,
							'stock': brick.SQty
						});

						//set the brick color
						b.setColorFromStr(brick.ColourDescr);

						//Add the created brick to the list
						_this.fetchData[data.REQUEST].addBrick(b);
					});
				}

				//We update the progress
			    currentPart++;
			    _this.UI_Progress_update(currentPart);

				//Check if we are done
			    if (currentPart >= _this.totalSearch) {

				    //Display all the lists in "fetchData"
					_this.displayLists();

				    //Stop the progress
				    _this.UI_Progress_done();

					//We can show the holder
					$(_this.UI.Main).find(_this.UI.SetPlaceholder).show();

					//Reset the button
					_this.UI_resetButtons();

					//We must also reset the Bootstrap Tooltips added with Javascript
					$('[data-toggle="tooltip"]').tooltip();
				}
			});
		});
	}

	//This function reset the UI and take cares of function once everything is done
	this.SetSearch.displayLists = function() {

		//For each list
		for (var i in this.fetchData) {

			//We create a the pannel
			var createdPannelID = this.UI_createPannel(
				this.fetchData[i].getProperty('ProductName'),
				this.fetchData[i].getProperty('ProductAsset'),
				this.fetchData[i].getProperty('ProductNo'),
				this.fetchData[i].getNbElements()
			);

			//All every bricks
			for (var j in this.fetchData[i].getBricks()) {
				this.parent.AddElementToTable(
					$(this.UI.Main).find(createdPannelID + " > table > tbody"),	// Destination
					$(this.UI.Main).find(this.UI.PartsTableSource), 			// Source
					this.fetchData[i].getBrick(j)								// Brick
				);
			}
		}
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
 //! ------------ BRICK SEARCH ------------
 */

PBHelper.prototype.BrickSearch = function() {

	//Keep a link to PBHelper
	this.BrickSearch.parent = this;

	/*
	 * BrickSearch variables
	 */

	 var totalSearch = 0; //Number of bricks to search for

	 this.fetchData = new Object;

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
	 * BrickSearch main Functions
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

		//Reset fetch data
		this.fetchData = new Object;

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
				timeout: _this.parent.AjaxTimeout * 1000,
				url: _this.parent.bricks_base_url + item + "&country=" + _this.parent.country,

			}).always(function(data) {

				//We use always because of the timeout because we want to catch cancel and not block
				//the UI. This help checkout error.
				if (data.statusText != null) {

					//Show error to the user
					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Error in AJAX request : Connexion timed out");

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.Placeholder));

					//Send error to console
					console.warn("Error in AJAX request : Connexion timed out", data);

				} else if (data.Bricks == null) {

					//Set the text
					$(_this.UI.Main).find(_this.UI.Error).find("span.txt").html("Element " + data.REQUEST + " not found");

					//Copy to the placeholder
					$(_this.UI.Main).find(_this.UI.Error).clone().attr('id', '').appendTo($(_this.UI.Main).find(_this.UI.Placeholder));

					//For debug purpose
					console.warn("Element " + data.REQUEST + " not found");

				} else {

					//Send to cache
					_this.parent.sendLEGODataToCache(data);

					//Create a list element
					_this.fetchData[data.REQUEST] = new LegoBrickList({
						"query" : data.REQUEST
					});

					//Process each brick in result
					$.each(data.Bricks, function( index, brick ){

						//Create a brick
						var b = new LegoElement({
							'ID' : parseInt(brick.ItemNo),
							'designid' : parseInt(brick.DesignId),
							'asset': data.ImageBaseUrl + brick.Asset,
							'itemDesc': brick.ItemDescr,
							'price': brick.Price,
							'currency': brick.CId,
							'stock': brick.SQty
						});

						//set the brick color
						b.setColorFromStr(brick.ColourDescr);

						//Add the created brick to the list
						_this.fetchData[data.REQUEST].addBrick(b);
					});
				}

				//We update the progress
			    currentPart++;
			    _this.UI_Progress_update(currentPart);

				//Check if we are done
			    if (currentPart >= _this.totalSearch) {

				  	//Display all the lists in "fetchData"
					_this.displayLists();

					//Stop the progress
					_this.UI_Progress_done();

					//We can show the holder
					$(_this.UI.Main).find(_this.UI.Placeholder).show();

					//Reset the button
					_this.UI_resetButtons();

					//We must also reset the Bootstrap Tooltips added with Javascript
					$('[data-toggle="tooltip"]').tooltip();
				}
			});
		});
	}

	//This function take care of displaying lists elements
	this.BrickSearch.displayLists = function() {

		//For each list
		for (var i in this.fetchData) {

			//We create a the pannel
			var createdPannelID = this.UI_createPannel( this.fetchData[i].getProperty('query') );

			//All every bricks
			for (var j in this.fetchData[i].getBricks()) {
				this.parent.AddElementToTable(
					$(this.UI.Main).find(createdPannelID + " > table > tbody"),	// Destination
					$(this.UI.Main).find(this.UI.PartsTableSource), 			// Source
					this.fetchData[i].getBrick(j)								// Brick
				);
			}
		}
	}

	this.BrickSearch.addElement = function(element) {

		var listID = $(element).parents(".listAdd").data('listid');
		var elementID = $(element).parents("tr").data('LegoElement');
		//var container = $(element).parents(".listAdd").data('container');

		//Get the data
		var elementData = $(element).parents('tr').data();

		console.log('addElement', listID, elementID, elementData);


		return;
		//Keep this safe
		var _this = this;

		//Post to PHP so the part is added to the list
		$.post( this.parent.users_base_url + "?action=addElementToList", {'listID' : listID, 'elementID' : elementID}, function( reponse ) {

			//!TODO: Ajouter feedback dans l'UI


			//Add the element to the master list
			//We do it here, otherwise it will appear in the list, but the state won't be saved
			_this.addElementToList(listID, elementID, elementData);

			//Reload the list if it's the current one
			if (listID == _this.active) {
				_this.refreshList();
			}

		});
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

/*
 //! ----------------- LIST -----------------
 */

PBHelper.prototype.List = function() {

	//Keep a link to PBHelper
	this.List.parent = this;

	/*
	 * List variables
	 */

	 this.List.lists = new Object();
	 this.List.active = 0;
	 this.List.SortValue = "ID";
	 this.List.SortOrder = "ASC";

	/*
	 * List UI variables
	 */

	this.List.UI = {
		"Main"			: this.options.List_interface,
		"Spinner"		: ".progressDiv",
		"Login"			: ".loginPanel",
		"Register"		: ".registerPanel",
		"Mainlist"		: ".mainlist",
		"listCreateForm": ".listCreateForm",
		"Templates"		: "#list_template",
		"Lists"			: ".listsPlaceholder",
		"ListDetail" 	: ".listContentPlaceholder",
		"PartsTableSource"	: "#LDDtemplateTable",
		"Progress"			: "#analyseList_progress",
		"listPrevious"		: ".listPrevious"
	};

	/*
	 * Main Functions
	 */

	//This function takes care of the login precedure
	this.List.Login = function(formElement) {

		//Reset the error
		$(this.UI.Main).find(this.UI.Login).find(".alert-danger").hide();
		$(this.UI.Main).find(this.UI.Login).find(".alert-danger > span").html("");

		//Disable button
		$(this.UI.Main).find(this.UI.Login).find(".btn").attr('disabled', 'disabled');

		//Get all the data
		var email = $(formElement).find('[name="email"]').val();
		var pass = $(formElement).find('[name="password"]').val();

		//Check if all field have something in it
		if (email.length == 0 || pass.length == 0) {
		 $(this.UI.Main).find(this.UI.Login).find(".alert-danger").show();
		 $(this.UI.Main).find(this.UI.Login).find(".alert-danger > span").html("Please fill in all the fields");
		 $(this.UI.Main).find(this.UI.Login).find(".btn").removeAttr('disabled');
		 return;
		}

		//We keep this secured
		var _this = this;

		//We send to PHP
		$.post( this.parent.users_base_url + "?action=login", {
			'email': email,
			'pass': pass,
		}, function( data ) {

			//Convert JSON
			var data = $.parseJSON(data);

			//Enabled buttons
			$(_this.UI.Main).find(_this.UI.Login).find(".btn").removeAttr('disabled');

			//Process data
			if (!data.success) {
				$(_this.UI.Main).find(_this.UI.Login).find(".alert-danger").show();
				$(_this.UI.Main).find(_this.UI.Login).find(".alert-danger > span").html("Email & password combinasion doesn't match");
				return;
			} else {
				_this.LoadUsers();
			}
		});

	}

	//This function takes care of the registration procedure
	this.List.Register = function(formElement) {

		//Reset the error
		$(this.UI.Main).find(this.UI.Register).find(".alert-danger").hide();
		$(this.UI.Main).find(this.UI.Register).find(".alert-danger > span").html("");

		//Disable button
		$(this.UI.Main).find(this.UI.Register).find(".btn").attr('disabled', 'disabled');

		//Get all the data
		var name = $(formElement).find('[name="name"]').val();
		var email = $(formElement).find('[name="email"]').val();
		var pass1 = $(formElement).find('[name="password1"]').val();
		var pass2 = $(formElement).find('[name="password2"]').val();

		//Check if all field have something in it
		if (name.length == 0 || email.length == 0 || pass1.length == 0 || pass2.length == 0) {
		 $(this.UI.Main).find(this.UI.Register).find(".alert-danger").show();
		 $(this.UI.Main).find(this.UI.Register).find(".alert-danger > span").html("Please fill in all the fields");
		 $(this.UI.Main).find(this.UI.Register).find(".btn").removeAttr('disabled');
		 return;
		}

		//Check if the two password are the same
		if (pass1 != pass2) {
		 $(this.UI.Main).find(this.UI.Register).find(".alert-danger").show();
		 $(this.UI.Main).find(this.UI.Register).find(".alert-danger > span").html("The two password are not the same");
		 $(this.UI.Main).find(this.UI.Register).find(".btn").removeAttr('disabled');
		 return;
		}

		//We keep this secured
		var _this = this;

		//We send to PHP
		$.post( this.parent.users_base_url + "?action=register", {
			'name': name,
			'email': email,
			'pass1': pass1,
			'pass2': pass2
		}, function( data ) {

			//Convert JSON
			var data = $.parseJSON(data);

			//Enabled buttons
			$(_this.UI.Main).find(_this.UI.Register).find(".btn").removeAttr('disabled');

			//Process data
			if (!data.success) {
				$(_this.UI.Main).find(_this.UI.Register).find(".alert-danger").show();
				$(_this.UI.Main).find(_this.UI.Register).find(".alert-danger > span").html("This email is already registered");
				return;
			} else {
				_this.UI_ShowLogin("Account registered successfully! You can now login.");
			}
		});
	 }

	//This function takes care of loading the user info and his lists from PHP
	this.List.LoadUsers = function() {

		//Show the spinner
		this.UI_ShowSpinner();

		//Reset some vars
		this.lists = new Object();
		this.active = 0;

		//We keep this secured
		var _this = this;

		//We get user data
		$.post( this.parent.users_base_url + "?action=List", function( reponse ) {

			//Convert JSON
			var reponse = $.parseJSON(reponse);

			//Process reponse
			if (reponse.success) {

				//Parse the PHP Data. This will send th lists to the cache in 'this'
				_this.parsePhpData(reponse.data.userlists);

				//Setup the main list of lists. The lists are already in 'this'
				_this.setupMainList(reponse.data.userdata);

			} else if (!reponse.success && reponse.errorCode == 406) {

				_this.UI_ShowLogin();

			} else {
				console.log("ERROR", reponse);
			}
		});
	}

	//This function takes the user lists returned by PHP and ut it into 'this'
	this.List.parsePhpData = function(userlists) {

		var _this = this;

		//We take care of analysing the list here
		$.each(userlists, function(i, list) {

			//Create a Lego brick list
			_this.lists[list.ID] = new LegoBrickList({
				"ID": list.ID,
				"name": list.listName,
				"createdOn": list.createdOn,
				"image" : _this.parent.defaultImage
			});

			//Add all bricks to the list
			$.each(list.bricks, function(i, brick) {

				//Create a brick object
				var b = new LegoElement({
					'ID' : parseInt(brick.elementID),
					'designid' : parseInt(brick.designID),
					'asset' : _this.parent.LEGOBaseURL + brick.Asset,
					'itemDesc' : brick.ItemDescr,
				});

				//Set the color
				b.setColorFromStr(brick.ColourDescr);

				//Now that the brick object is created, we add the brick to the list
				_this.lists[list.ID].addBrick(b, parseInt(brick.qte));

			});
		});
	}

	//This function takes care of the Logout procedure
	this.List.Logout = function() {

		//We keep this secured
		var _this = this;

		//We get user data
		$.post( this.parent.users_base_url + "?action=logout", function( reponse ) {

			//Reload the list
			_this.LoadUsers();
		});
	}

	//This function takes care of analysing the lists and displaying the list of the lists
	this.List.setupMainList = function(userdata) {

		//Setup the pannel header
		$(this.UI.Main).find(this.UI.Mainlist).find("h3 span").html(userdata.username);

		//Preserve this
		var _this = this;

		//Empty the
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.Lists).html("");

		//Go trought each liat title
		$.each(this.lists, function(listID, listData) {

			//Grab the template
			var t = $(_this.UI.Main).find(_this.UI.Templates).find("#listElementTemplate").clone();

			//First, remove the id
			$(t).attr('id', '');

			//Set the data inside template
			$(t).find("h4").html( listData.getProperty('name') );
			$(t).find("img").attr('src', listData.getProperty('image') );
			$(t).find("p.createdOn > span").html( listData.getProperty('createdOn') );
			$(t).find("p.nbPieces > span").html( listData.getNbBricks() );
			$(t).find("p.nbElements > span").html( listData.getNbElements() );
			$(t).data("listID", listID);

			//Add to the DOM destination
			$(t).appendTo($(_this.UI.Main).find(_this.UI.Mainlist).find(_this.UI.Lists));
		});

		//Show the list
		this.UI_ShowMain();

	}

	//This function take care of creating a new list
	this.List.CreateList = function(formElement) {

		//Ask for the list name
		var listName = $(formElement).find('[name="listName"]').val();

		//Check to see if line is empty
		if (listName == "") {

			//Use alert. I'm lazy
			alert("List name can't be blank !");

		} else {

			//Preserve this
			var _this = this;

			//Desactivate buttons before sending to PHP
			$(formElement).find(".btn").attr('disabled', 'disabled');

			//Send to PHP!
			$.post( this.parent.users_base_url + "?action=createList", {'listName' : listName}, function( reponse ) {

				//Convert JSON
				var reponse = $.parseJSON(reponse);

				//Enable the buttons
				$(formElement).find(".btn").removeAttr('disabled');

				//Process reponse
				if (reponse.success) {

					//Empty the form
					$(formElement).find('[name="listName"]').val("");

					//Reset the forum
					_this.UI_hideCreateList();

					//Reload the list
					_this.LoadUsers();

				} else {

					//Again, lazy. Using alert for the error.
					//console.log("ERROR", reponse);
					alert("An error occured : " + reponse.msg);
				}
			});
		}
	}

	//This function is called when a list is selected. It define the current list and display it
	this.List.showList = function(element) {

		//Get the list data
		this.active = $(element).data('listID');

		//Refresh the current list
		this.refreshList();
	}

	//This function is used to display a list in the HTML table
	this.List.refreshList = function() {

		//Reset the table
		this.UI_resetPartsTable();

		//Keep this safe
		var _this = this;

		//Setup everything
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).find(".panel-heading").html( this.lists[this.active].getProperty('name') );
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).find(".setNbPieces").html( this.lists[this.active].getNbBricks() );
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).find(".setNbUniqueElements").html( this.lists[this.active].getNbElements() );
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).find("img").attr('src', this.lists[this.active].getProperty('image') );

		//Show the previous button and hide the create list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).show();		//Show the List Detail
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.Lists).hide();			//Hide the list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.listCreateForm).hide(); //Hide the create list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.listPrevious).show();	//Show the previous button

		//Sort the list
		//Be careful here: sorted list will ONLY return an array of elementID (keys) based on the order the list needs to be displayed.
		//We don't send the whole object sorted because apparently that CAN'T be done.
		var sortedList = this.parent.SortList(this.lists[this.active].getBricks(), this.SortValue, this.SortOrder);

		//We add each brick to the table.
		//Again, sortedList is an array of elementIDs... Be carefull
		for (var key in sortedList) {
			this.parent.AddElementToTable(
				$(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table > tbody"),	// Destination
				$(this.UI.Main).find(this.UI.PartsTableSource), 										// Source
				this.lists[this.active].getBrick(sortedList[key])										// Brick
			);
		}

		//We process and add the total row
		//this.Analyse_addTotalRow();
		//We set the value in the template
		//this.lists[this.active].getNbElements()
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").find(".txtTotal").html( this.lists[this.active].getValue(true) );

		//We copy the total row to the pannel
		$(this.UI.Main).find(this.UI.PartsTableSource).find(".templateTable_Totalrow").clone().appendTo($(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table > tfoot"));

	}

	//This function analyse the parts list and found each part info from LEGO service
	this.List.Analyse = function() {

		//Don't do anything if the list is empty
		if (this.lists[this.active].getNbElements() <= 0) {
			return;
		}

		//Reset the table
		this.UI_resetPartsTable();

		//Hide the table
		$(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table").hide();

		//Disabled the buttons
		this.UI_disableButtons();

		//Show the progress
		this.UI_Progress_init();

		//Variable to keep progress of the current number of part processed
		var currentPart = 0;

		//We are going into .each. We need to make "this" safe
		var _this = this;

		var bricks = this.lists[this.active].getBricks();

		//We add each brick to the table
		for (var key in bricks) {

			//Start with analaytics
			this.parent.SendAnalytics(this.parent.bricks_base_url + bricks[key].data.getProperty('ID') + "&country=" + this.parent.country, "Get item or design from list");

			$.ajax({

				method: "GET",
				timeout: _this.parent.AjaxTimeout * 1000,
				url: this.parent.bricks_base_url + bricks[key].data.getProperty('ID') + "&country=" + this.parent.country,

			}).always(function(data) {

				//We use always because of the timeout because we want to catch cancel and not block
				//the UI. This help checkout error.
				if (data.statusText != null) {

					//!TODO: Show error to the user

					//Send error to console
					console.warn("Error in AJAX request", data);

				} else if (data.Bricks == null) {

					//!TODO Show error to user
					console.warn("Element " + data.REQUEST + " not found", data);

				} else {

					//Send to db cache
					_this.parent.sendLEGODataToCache(data);

					//Get the brick and put it a var for shortcut
					//!TODO HERE
					var brick = _this.lists[_this.active].getBrick(data.REQUEST);

					//!TODO HERE !!!!!!!

					//Update the price from the list brick element
					brick.data.setProperty("price", data.Bricks[0].Price);
					brick.data.setProperty("currency", data.Bricks[0].CId);

					//We will also update other infos, just in case
					//N.B.: We shoul'd have to touch the color
					brick.data.setProperty("asset", data.ImageBaseUrl + data.Bricks[0].Asset);
					brick.data.setProperty("designid", data.Bricks[0].DesignId);
					brick.data.setProperty("itemDesc", data.Bricks[0].ItemDescr);
					brick.data.setProperty("stock", data.Bricks[0].SQty);
				}

				//We update the progress. Outside the previous if block so even with
				//an error we continue to the next part.
			    currentPart++;
			    _this.UI_Progress_update(currentPart);


				//Check if we are done
			    if (currentPart >= _this.lists[_this.active].getNbElements()) {

					//Shutdown the progress bar
					_this.UI_Progress_done();

					//Reload the list
					_this.refreshList();

					//We show the table
					_this.UI_showPartsTable();

					//To set the buttons, we reable them and disabled again with the switch
					_this.UI_resetButtons();
				}
			});
		}
	}

	//This function is called by the UI to change the order of the list.
	//It only change the global param and refresh the list. The refresh function take care of the actual sorting
	this.List.SortTable = function(SortBy, Order) {

		//Save the order
		this.SortValue = SortBy;
		this.SortOrder = Order;

		//Refresh the list
		this.refreshList();
	}

	this.List.setupAddButton = function(destination) {

		//Ref. for the idea of the dropdown:
		//http://www.bootply.com/9CvIygzob8

		//If there's no list, we hide the destination and quit
		if (Object.keys(this.lists).length == 0) {
			$(destination).hide();
			return;
		}

		//Cleanup the old stuff
		$(destination).find(".dropdown-menu").html("");

		//Keep this safe
		var _this = this;

		//Do something for each list
		$.each(this.lists, function(i, data) {
			$(destination).find(".dropdown-menu").append('<li><a href="javascript:void(0);" onclick="App.updateAddButton(this)" data-listid="' + i + '">' + data.getProperty('name') + '</a></li>');
		});

		//If the user havn't looked at his list yet, we won't have a currentList defined ( = 0 )
		//So we pick the first one.
		if (this.active == 0) {

			//Get the first key
			//Ref.: http://stackoverflow.com/a/11509718
			var i = Object.keys(this.lists)[0];

		} else {

			var i = this.active;
		}

		//Setup the current one
		$(destination).find(".btn-select > span.txt").html(this.lists[i].getProperty('name'));
		$(destination).data('listid', i);
	}

	this.List.addElement = function(listID, brick) {

		//Keep this safe
		var _this = this;

		//Post to PHP so the part is added to the list
		$.post( this.parent.users_base_url + "?action=addElementToList", {'listID' : listID, 'elementID' : brick.data.getProperty('ID')}, function( reponse ) {

			//!TODO: Ajouter feedback dans l'UI
			//console.log("ADDING TO LIST ID " + listID, brick.data.getProperty('ID'), brick.data);

			//Add the element to the master list
			//We do it here, otherwise it will appear in the list, but the state won't be saved
			_this.lists[listID].addBrick(brick.data);

			//Reload the list if it's the current one
			if (listID == _this.active) {
				_this.refreshList();
			}
		});
	}

	 /*
	 * UI Functions
	 */

	//This function show the Spinner HTML element
	this.List.UI_ShowSpinner = function() {
		$(this.UI.Main).find(this.UI.Spinner).show();
		$(this.UI.Main).find(this.UI.Login).hide();
		$(this.UI.Main).find(this.UI.Register).hide();
		$(this.UI.Main).find(this.UI.Mainlist).hide();
		$(this.UI.Main).find(this.UI.listCreateForm).hide();
	}

	//This function shows the Registration HTML element
	this.List.UI_ShowRegister = function() {
		$(this.UI.Main).find(this.UI.Spinner).hide();
		$(this.UI.Main).find(this.UI.Login).hide();
		$(this.UI.Main).find(this.UI.Register).show();
		$(this.UI.Main).find(this.UI.Mainlist).hide();
		$(this.UI.Main).find(this.UI.listCreateForm).hide();
	}

	//This function shows the login HTML element
	this.List.UI_ShowLogin = function(successMsg) {
		$(this.UI.Main).find(this.UI.Spinner).hide();
		$(this.UI.Main).find(this.UI.Login).show();
		$(this.UI.Main).find(this.UI.Register).hide();
		$(this.UI.Main).find(this.UI.Mainlist).hide();
		$(this.UI.Main).find(this.UI.listCreateForm).hide();

		if (successMsg) {
			$(this.UI.Main).find(this.UI.Login).find(".alert-success").show();
			$(this.UI.Main).find(this.UI.Login).find(".alert-success > span").html(successMsg);
		} else {
			$(this.UI.Main).find(this.UI.Login).find(".alert-success").hide();
		}
	}

	//This function shows the list of lists
	this.List.UI_ShowMain = function() {
		$(this.UI.Main).find(this.UI.Spinner).hide();
		$(this.UI.Main).find(this.UI.Login).hide();
		$(this.UI.Main).find(this.UI.Register).hide();
		$(this.UI.Main).find(this.UI.Mainlist).show();
		$(this.UI.Main).find(this.UI.listCreateForm).show();
	}

	//This list show the list HTML
	this.List.UI_ShowLists = function() {
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.ListDetail).hide();		//Hide the List Detail
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.Lists).show();			//Show the list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.listCreateForm).show(); //Show the create list
		$(this.UI.Main).find(this.UI.Mainlist).find(this.UI.listPrevious).hide();	//Hide the previous button
	}

	//This function show the "Create list" form
	this.List.UI_showCreateList = function() {

		//Hide the button
		$(this.UI.Main).find(this.UI.Mainlist).find(".btn-showCreate").hide();

		//Show the form
		$(this.UI.Main).find(this.UI.Mainlist).find("#listCreateForm").show();

	}

	//This function hide the "Create list" form
	this.List.UI_hideCreateList = function() {

		//Hide the button
		$(this.UI.Main).find(this.UI.Mainlist).find(".btn-showCreate").show();

		//Show the form
		$(this.UI.Main).find(this.UI.Mainlist).find("#listCreateForm").hide();

	}

	//This function reset the parts table
	this.List.UI_showPartsTable = function() {

		//Show the table
		$(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table").show();

		//We must also reset the Bootstrap Tooltips added with Javascript
		$('[data-toggle="tooltip"]').tooltip();
	}

	//This function reset the parts table
	this.List.UI_resetPartsTable = function() {
		$(this.UI.Main).find(this.UI.Mainlist + " > .listContentPlaceholder > table").find("tr:gt(0)").remove(); //Remove all lines
	}

	//This function disabled all button. Option can omit the destroy one
	this.List.UI_disableButtons = function() {

		$(this.UI.Main).find(this.UI.Mainlist).find(".btn").attr('disabled', 'disabled');
	}

	//This function reset the buttons state
	this.List.UI_resetButtons = function() {
		$(this.UI.Main).find(this.UI.Mainlist).find(".btn").removeAttr('disabled');
	}

	//This function set the analyser progress bar
	this.List.UI_Progress_init = function() {
		$(this.UI.Main).find(this.UI.Progress).show();
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html("0");
		$(this.UI.Main).find(this.UI.Progress).find("span.totalnb").html( this.lists[this.active].getNbElements() );
		$(this.UI.Main).find(this.UI.Progress).find("div.progress-bar").css("width", "0%");
	}

	//This function update the analyser progress bar.
	this.List.UI_Progress_update = function(current) {
		$(this.UI.Main).find(this.UI.Progress).find("span.current").html(current+1);
		$(this.UI.Main).find(this.UI.Progress).find("div.progress-bar").css("width", (current/( this.lists[this.active].getNbElements() )*100)+"%");
	}

	//This function hide the analyser progress bar.
	this.List.UI_Progress_done = function() {
		$(this.UI.Main).find(this.UI.Progress).hide();
	}

	//Must check ig we're already loged in
	this.List.LoadUsers();
}

/*
 //! ------------- NAVIGATION -------------
 */

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

/*
 //! ------------- Lego List -------------
 */

function LegoBrickList(initData) {

	/*
	 * Public variables
	 */



	/*
	 * Private variables
	 */

	var bricks = new Object();
	var properties = {};
	var listValue = 0;

	/*
	 * Public functions
	 */

	this.setProperties = function(data) {
		for (var key in data) {
			this.setProperty(key, data[key]);
		}
		return true;
	}

	this.setProperty = function(key, value) {
		if (key == "bricks") {
			console.warn("LegoBrickList : Property 'bricks' can't be set or overwritten this way.");
			return false
		} else {
			properties[key] = value;
			return true;
		}
	}

	this.getProperties = function() {
		return properties;
	}

	this.getProperty = function(key) {
		return properties[key];
	}

	this.addBrick = function(lego_element, qte) {

		//The specified brick needs to be a Lego Element object
		if (!(lego_element instanceof LegoElement)) {
			throw new Error("Specified brick is not a valid Lego element");
		}

		//Small shortcut fot the brick ID
		//var i = lego_element.getProperty("ID");
		var i = this.getNbElements() + 1;

		//if quantity is undefined, we set it to 1
		if (qte == undefined) { qte = 1; }

		//Check if this brick already exist in the list
		if ( bricks[i] == undefined ) {

			//Add the brick to the list
			bricks[i] = new Object();
			//1bricks[i].ID = i;
			bricks[i].qte = qte;
			bricks[i].data = lego_element;

		//It does exist...
		} else {

			//...increment the qte
			bricks[i].qte = bricks[i].qte + qte;
		}
	}

	//! TODO : Delete brick

	this.getBricks = function() {

		//Create the return variable
		var retour = new Object;

		//Parse each bricks to add the calculated data
		for (var i in bricks) {
			retour[i] = this.getBrick(i);
		}

		return retour;
	}

	this.getBrick = function(i) {

		//Store the brick data in a temp var
		temp = bricks[i];

		if (temp == null) {
			return null;
		}

		//Add calculated properties
		temp.value = 	getBrickValue(bricks[i].data, bricks[i].qte, false);
		temp.valueStr = getBrickValue(bricks[i].data, bricks[i].qte, true)

		//Done
		return temp;
	}

	/*this.getBrickData = function(i) {

		//Get the properties and put them in the return object
		var obj = bricks[i].data.getProperties();

		//Adding the quantity to the return object
		obj['qte'] = 		bricks[i].qte;
		obj['value'] = 		getBrickValue(bricks[i].data, bricks[i].qte, false);
		obj['valueStr'] = 	getBrickValue(bricks[i].data, bricks[i].qte, true);

		//Done !
		return obj;
	}*/

	this.getNbBricks = function() {

		var nb = 0;

		//Go trought all the bricks
		for (var key in bricks) {
			nb = nb + bricks[key].qte;
		}

		return nb;
	}

	this.getNbElements = function() {

		return Object.keys(bricks).length;
	}

	this.getValue = function(format) {

		var value = 0;

		//Go trought all the bricks
		for (var key in bricks) {
			value = value + bricks[key].value;
		}

		if (format) {
			return (Math.round(value * 100) / 100).toFixed(2) + " $";
		} else {
			return value;
		}
	}

	/*
	 * Private functions
	 */

	function getBrickValue(brick, qte, format) {

		//Get the properties and put them in the return object
		var price = brick.getProperty('price');

		//Calculate the total, format and return
		if (format) {

			//Take care of the errors
			if (price <= 0) {

				return "-";

			} else {

				retour = (Math.round(price * qte * 100) / 100).toFixed(2) + " $";

				//Add currency if defined
				if (brick.getProperty('currency') != "" && brick.getProperty('currency') != null) {
					retour = retour + brick.getProperty('currency');
				}

				return retour;
			}

		} else {

			//Use the max with 0. If the Price is negative (error), we send back 0
			return Math.max(0, (Math.round(price * qte * 100) / 100).toFixed(2));
		}
	}

	/*
	 * Init code
	 */

	if (typeof(initData) == "object") {

		for (var key in initData) {
			this.setProperty(key, initData[key]);
		}

	 } else if (initData != undefined) {
		 console.warn("LegoBrickList : initData ignored - Invalid object.");
	 }

	 return true;
}

/*
 //! ------------- Lego Element -------------
 */

function LegoElement(initData) {

	/*
	 * Public variables
	 */

	/*
	 * Private variables
	 */

	//var ID = ID;
	var colorCode = 0;
	var colorLegoStr = "";
	var properties = {
		'ID' : 0,
		'designid' : 0,
		'asset' : "assets/img/defaultimg.gif",
		'itemDesc' : "",
		'price' : 0,
		'currency': "",
		'stock': -1
	};

	/*
	 * Public functions
	 */

	this.setProperty = function(key, value) {

		//Check value
		if (value == null) {
			console.warn("LegoElement : Property '" + key +"' cannot be set to null");

		} else if (properties[key] != null) {
			properties[key] = value;

		} else {
			console.warn("LegoElement : Property '" + key +"' can't be set or overwritten.");
		}
	}

	this.setColor = function(code) {

		//Make sure it's an INT
		code = parseInt(code);

		//Check the param
		if (typeof(code) != "number" || code <= 0) {
			throw new Error("LegoElement : Invalid color code -> " + code);
		}

		//Do it
		colorCode = code;
	}

	this.setColorFromStr = function(colorStr) {

		//Get a code
		code = getColorCodeFromLegoStr(colorStr);

		//Check for error (-1)
		if (code <= 0) {
			console.warn("LegoElement : Cannot match LEGO color string to color Code (" + colorStr + ")");
		}

		//Do it
		colorCode = code;
		colorLegoStr = colorStr;
	}

	this.getProperties = function() {

		//Store the properties in a temp var
		temp = properties;

		//Add privates and computed properties
		temp['priceStr'] = getPriceString();
		temp['color'] = colorCode;
		temp['colorName'] = getColorName(colorCode);
		temp['colorStr'] = getColorLegoStr(colorCode);

		//Returned the computed properties
		return temp;
	}

	this.getProperty = function(key) {

		//Cutom property 'ID'
		if (key == "priceStr") {
			return getPriceString();

		} else if (key == "color") {
			return colorCode;

		} else if (key == "colorName") {
			return getColorName(colorCode);

		} else if (key == "colorStr") {
			return getColorLegoStr(colorCode);

		//Take take of everything in the "public" properties
		} else {
			return properties[key];
		}
	}

	/*
	 * Private functions
	 */

	function getPriceString() {

		//Case n° 1 : Price has not been defined yet
		if (properties.price == 0) {

			return "-";

		} else {

			//Return the defined price
			retour = (Math.round(properties.price * 100) / 100).toFixed(2) + " $";

			//Add currency if defined
			if (properties.currency != "" && properties.currency != null) {
				retour = retour + properties.currency;
			}

			return retour;
		}

	}

	function getColorCodeFromLegoStr(colorStr) {

		//Gro throught all the colors
		for (var code in LEGO_Color) {

			//Check for all the codes if we can find a match
			if (LEGO_Color[code].LegoID != null && colorStr != null && LEGO_Color[code].LegoID.toLowerCase() === colorStr.toLowerCase()) {

				//Return the current code
				return code;
			}
		}

		return -1;

	}

	function getColorName(colorCode) {

		//Get the color from the
		if (LEGO_Color[colorCode] != null) {

			return LEGO_Color[colorCode].Name;

		//In case we have some string we can use
		} else if( colorLegoStr != "") {

			return colorLegoStr;

		//Nope. Return nothing
		} else {
			return "";
		}
	}

	function getColorLegoStr(colorCode) {

		//Get the color from the
		if (LEGO_Color[colorCode] != null) {

			return LEGO_Color[colorCode].LegoID;

		//Nope. Return nothing
		} else {
			return "";
		}
	}

	 /*
	 * Init code
	 */

	 if (typeof(initData) == "object") {

		for (var key in initData) {
			this.setProperty(key, initData[key]);
		}

	 } else if (initData != undefined) {
		 console.warn("LegoElement : initData ignored - Invalid object.", initData);
	 }

	 return true;
}